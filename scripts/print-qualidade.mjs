// Print de comparação de qualidade das fotos (antes/depois).
// Sempre o mesmo trecho: a parede de obras da aba do jardim, em 1440px
// com densidade 2 (tela "retina", onde foto pequena esticada aparece mais).
// Uso:  node scripts/print-qualidade.mjs <id-da-aba> <arquivo.png>
//   ex: node scripts/print-qualidade.mjs jardim-de-esculturas prints/qualidade-depois.png
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const [aba = 'jardim-de-esculturas', saida = 'prints/qualidade-depois.png'] = process.argv.slice(2);
const PASTA_SITE = path.resolve('dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

// Servidor estático mínimo para a pasta dist/
const servidor = http.createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  try {
    const arquivo = await readFile(path.join(PASTA_SITE, caminho));
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho)] || 'application/octet-stream' }).end(arquivo);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => servidor.listen(4397, ok));

const browser = await chromium.launch();
// reducedMotion: as molduras já aparecem montadas, sem esperar animação
const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await contexto.newPage();
await page.goto(`http://localhost:4397/#${aba}`);
await page.evaluate(async () => {
  const fotos = [...document.querySelectorAll('.painel:not([hidden]) img')];
  fotos.forEach((img) => (img.loading = 'eager'));
  await Promise.all(fotos.map((img) => img.decode().catch(() => {})));
});
await page.waitForTimeout(600);
// o trecho: a primeira fileira de molduras da parede
// rola o palco até a parede ficar 140px abaixo do topo (longe da faixa caramelo)
await page.evaluate(() => {
  const palco = document.querySelector('.palco');
  const parede = document.querySelector('.painel:not([hidden]) .parede__obras');
  palco.scrollTop += parede.getBoundingClientRect().top - 140;
});
await page.waitForTimeout(400);
const caixa = await page.locator('.painel:not([hidden]) .parede__obras').first().boundingBox();
await page.screenshot({ path: saida, clip: { x: caixa.x - 20, y: caixa.y - 40, width: caixa.width + 40, height: 600 } });
console.log('print salvo em', saida);
await browser.close();
servidor.close();
