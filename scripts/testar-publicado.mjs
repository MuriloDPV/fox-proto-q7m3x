// Testa o site publicado (https://ludwig.athomon.com) e salva prints em prints/publicado/.
// Rodar:  node scripts/testar-publicado.mjs
// Igual ao prints.mjs: window.open só ANOTA o endereço, para não abrir o motor de verdade.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const URL_SITE = 'https://ludwig.athomon.com/';
const PASTA = path.resolve('prints', 'publicado');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
await mkdir(PASTA, { recursive: true });

const navegador = await chromium.launch();
const r = {};

// http:// tem que redirecionar para https://
{
  const pagina = await navegador.newPage();
  const resp = await pagina.goto('http://ludwig.athomon.com/');
  r.httpVaiParaHttps = pagina.url().startsWith('https://') && resp.ok();
  await pagina.close();
}

for (const largura of [390, 1440]) {
  const contexto = await navegador.newContext({ viewport: { width: largura, height: largura < 600 ? 844 : 900 } });
  await contexto.addInitScript(() => {
    window.__abertos = [];
    window.open = (url) => {
      window.__abertos.push(String(url));
      return null;
    };
  });
  const page = await contexto.newPage();
  const resp = await page.goto(URL_SITE, { waitUntil: 'load' });
  await page
    .waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: 9000 })
    .catch(() => {});
  await espera(1500);
  await page.screenshot({ path: path.join(PASTA, `${largura}-inicio.png`) });

  if (largura === 1440) {
    r.status = resp.status();
    r.https = page.url().startsWith('https://');
    r.ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    r.robots = await page.getAttribute('meta[name="robots"]', 'content');

    // WhatsApp: todos os links apontam para o número de reservas
    r.whatsLinks = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll('a[href*="whatsapp"]')].map((a) => new URL(a.href).searchParams.get('phone')))],
    );

    // Busca: Hospedagem → "Ver datas" → datas → URL do motor
    await page.click('[data-abrir-menu]');
    await espera(1000);
    await page.click('#aba-hospedagem');
    await espera(1700);
    await page.locator('#acomodacao-suite-dubai').scrollIntoViewIfNeeded();
    await espera(800);
    await page.click('#acomodacao-suite-dubai [data-abrir-busca]');
    await espera(900);
    await page.fill('#busca-janela-checkin', '2027-03-12');
    await page.fill('#busca-janela-checkout', '2027-03-14');
    await page.screenshot({ path: path.join(PASTA, `${largura}-busca.png`) });
    await page.click('#reservar button[type="submit"]');
    await espera(400);
    r.buscaUrl = await page.evaluate(() => window.__abertos.at(-1));
  }
  await page.screenshot({ path: path.join(PASTA, `${largura}-pagina-inteira.png`), fullPage: largura === 390 });
  await contexto.close();
}

// O motor de reservas responde de verdade?
{
  const pagina = await navegador.newPage();
  const resp = await pagina.goto(r.buscaUrl, { waitUntil: 'domcontentloaded' }).catch((e) => ({ status: () => String(e) }));
  r.motorStatus = resp.status();
  await pagina.close();
}

await navegador.close();
console.log(JSON.stringify(r, null, 2));
