// Baixa de novo as fotos das galerias do site atual, agora em JPEG.
// Descoberta da v3: o servidor de imagens olha o cabeçalho "Accept" do
// navegador. Para o Chrome (que aceita webp) ele converte o JPEG em webp,
// perdendo mais um pouco de qualidade. Pedindo sem "image/webp", ele
// entrega o JPEG original, que é a melhor entrada para o upscale.
// Salva em fotos-originais/galeria/<categoria>/<id>.jpg
// Rodar:  node scripts/baixar-galerias-jpg.mjs
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://images3.motor-reserva.com.br/curl/motor_reserva/images/galeria_foto/cliente_6712/';

// As pastas antigas (em webp) usam o próprio id da foto como nome
const pedidos = [];
for (const categoria of ['estrutura', 'cafe', 'piscina']) {
  for (const arq of await readdir(`fotos-originais/${categoria}`)) {
    pedidos.push({ categoria, id: arq.replace('.webp', '') });
  }
}

// Da galeria "Acomodações", só as fachadas e detalhes usados fora da
// aba Hospedagem (o nome original está no manifest.csv dela)
const EXTRAS = ['acomodacoes-001', 'acomodacoes-008', 'acomodacoes-009', 'acomodacoes-012', 'acomodacoes-013', 'acomodacoes-034'];
const manifesto = (await readFile('fotos-originais/acomodacoes/manifest.csv', 'utf8')).trim().split('\n').slice(1);
for (const linha of manifesto) {
  const [arquivo, , , origem] = linha.split(';');
  const nome = arquivo.replace('.webp', '');
  if (EXTRAS.includes(nome)) pedidos.push({ categoria: 'extras', id: origem.replace('.jpg', ''), nome });
}

for (const { categoria, id, nome } of pedidos) {
  // Accept sem webp → o servidor devolve o JPEG original
  const resposta = await fetch(`${BASE}${id}.jpg`, { headers: { Accept: 'image/jpeg,image/*;q=0.8' } });
  if (!resposta.ok) {
    console.log('falhou', categoria, id, resposta.status);
    continue;
  }
  const pasta = path.join('fotos-originais/galeria', categoria);
  await mkdir(pasta, { recursive: true });
  await writeFile(path.join(pasta, `${nome || id}.jpg`), Buffer.from(await resposta.arrayBuffer()));
}
console.log(pedidos.length, 'fotos baixadas');
