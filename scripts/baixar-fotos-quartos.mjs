// Baixa as fotos de cada acomodação direto do motor de reservas.
// Por que daqui e não da galeria do site? As fotos do quarto no motor
// (images3.motor-reserva.com.br/.../images/quarto/cliente_6712/...) costumam
// ser bem maiores que as da galeria (620 px).
//
// Como funciona:
//   1. abre /acomodacao num navegador sem janela (Playwright "headless");
//   2. junta os links de cada acomodação;
//   3. em cada página, lê só as fotos do carrossel principal
//      (my-portal-slide-gallery .mySlides), para não pegar as fotos da
//      seção "outras acomodações";
//   4. baixa cada foto para fotos-originais/quartos/<nome-da-acomodacao>/.
// Rodar:  node scripts/baixar-fotos-quartos.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp'; // já vem com o Astro; aqui só lê largura/altura

const BASE = 'https://www.chacaraludwig.com.br/acomodacao';
const PASTA = path.resolve('fotos-originais/quartos');

// O arquivo diz .png, mas o formato real pode ser outro: os primeiros
// bytes ("assinatura") dizem o que ele é de verdade.
function extensaoReal(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  if (bytes.slice(8, 12).toString() === 'WEBP') return 'webp';
  return 'bin';
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

// Links do tipo /acomodacao/suite-espanha/7727391
const links = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll('a[href*="/acomodacao/"]')].map((a) => a.href))],
);

const manifesto = ['acomodacao;arquivo;largura;altura;url'];

for (const link of links) {
  const slug = new URL(link).pathname.split('/')[2]; // "suite-espanha"
  await page.goto(link, { waitUntil: 'networkidle', timeout: 60000 });
  const { nome, fotos } = await page.evaluate(() => ({
    nome: document.querySelector('h1, h2')?.textContent.trim(),
    fotos: [
      ...new Set(
        [...document.querySelectorAll('my-portal-slide-gallery .mySlides img')].map((img) => img.currentSrc || img.src),
      ),
    ],
  }));

  const pasta = path.join(PASTA, slug);
  await mkdir(pasta, { recursive: true });

  for (const [i, url] of fotos.entries()) {
    const resposta = await fetch(url);
    const bytes = Buffer.from(await resposta.arrayBuffer());
    const arquivo = `${String(i + 1).padStart(2, '0')}.${extensaoReal(bytes)}`;
    await writeFile(path.join(pasta, arquivo), bytes);
    const { width, height } = await sharp(bytes).metadata();
    manifesto.push(`${slug};${arquivo};${width};${height};${url}`);
  }
  console.log(`${nome}: ${fotos.length} fotos`);
}

await writeFile(path.join(PASTA, 'manifest.csv'), manifesto.join('\n') + '\n');
await browser.close();
