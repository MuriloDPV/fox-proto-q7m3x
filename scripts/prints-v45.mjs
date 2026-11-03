// Verificação da v4.5: "nenhum texto em cima de foto".
// Para cada aba, em 390x844 e 1440x900:
//   1. print da PRIMEIRA TELA (como a pessoa vê ao abrir a aba);
//   2. checagem automática: procura qualquer texto visível cuja área
//      encoste numa foto (<img> ou background-image). Tem que dar zero.
//   3. etiqueta do protótipo (no topo, só no computador): não pode cobrir
//      texto, botão nem foto;
//   4. rolagem lateral e linhas de título cortadas.
// Saída: prints/v4.5/ (prints + sobreposicoes.json).
//
// Rodar (usa o site gerado em dist/):
//   npm run build  &&  node scripts/prints-v45.mjs
// Ou contra o servidor de desenvolvimento (antes de mexer, para comparar):
//   node scripts/prints-v45.mjs http://localhost:4321/ antes
//   (2º argumento: subpasta dos prints; padrão: nenhuma)
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const URL_ARG = process.argv[2];
const PASTA_PRINTS = path.resolve('prints', 'v4.5', process.argv[3] || '');
const PORTA = 4398;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Sem endereço no argumento: servidor estático mínimo para a pasta dist/
let servidor;
let URL_BASE = URL_ARG;
if (!URL_BASE) {
  servidor = http.createServer(async (req, res) => {
    let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (caminho.endsWith('/')) caminho += 'index.html';
    try {
      const arquivo = await readFile(path.join(path.resolve('dist'), caminho));
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho)] || 'application/octet-stream' });
      res.end(arquivo);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((ok) => servidor.listen(PORTA, ok));
  URL_BASE = `http://localhost:${PORTA}/`;
}

await mkdir(PASTA_PRINTS, { recursive: true });

const ABAS = ['inicio', 'hospedagem', 'jardim-de-esculturas', 'eventos', 'gastronomia', 'lazer', 'visite'];
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

// Mostra tudo que só apareceria ao rolar (títulos, fotos, números)
const MONTAR_TUDO = async () => {
  document.querySelectorAll('[data-linhas], [data-revelar], [data-surgir]').forEach((el) => el.classList.add('visivel'));
  document.querySelectorAll('[data-contar]').forEach((n) => (n.textContent = n.dataset.contar));
  const fotos = [...document.querySelectorAll('.painel:not([hidden]) img, .rodape img')];
  fotos.forEach((img) => (img.loading = 'eager'));
  await Promise.all(fotos.map((img) => img.decode().catch(() => {})));
};

// ---------------------------------------------------------------
// A CHECAGEM (roda dentro da página, com a página no topo: scroll 0)
// Compara retângulos em coordenadas da PÁGINA (somando o scroll), então
// pega a página inteira de uma vez, não só a primeira tela.
// ---------------------------------------------------------------
const CHECAR_SOBREPOSICAO = () => {
  const sy = scrollY;
  // retângulo em coordenadas da página
  const naPagina = (r) => ({ x: r.left, y: r.top + sy, r: r.right, b: r.bottom + sy });
  const area = (a) => Math.max(0, a.r - a.x) * Math.max(0, a.b - a.y);
  const cruza = (a, b) => ({ x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });

  // visível de verdade: sem display:none, visibility:hidden ou opacidade 0
  // em nenhum ancestral (checkVisibility faz isso)
  const visivel = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true });

  // Recorta pelo "overflow" dos ancestrais (ex.: carrossel que esconde as
  // fotos que estão fora da faixa)
  const recortar = (el, ret) => {
    for (let p = el.parentElement; p && ret; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        ret = cruza(ret, naPagina(p.getBoundingClientRect()));
        if (area(ret) <= 0) return null;
      }
    }
    return ret;
  };

  // nome curto para o relatório: tag.classe#id
  const nome = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;

  // 1. As fotos: <img> e qualquer elemento com background-image de arquivo
  const fotos = [];
  for (const el of document.querySelectorAll('body *')) {
    const ehImg = el.tagName === 'IMG';
    const fundo = !ehImg && /url\(/.test(getComputedStyle(el).backgroundImage);
    if (!ehImg && !fundo) continue;
    if (el.closest('.lightbox, dialog:not([open])')) continue;
    if (!visivel(el)) continue;
    // logos e ícones não são "foto"
    if (el.closest('.topo__logo, .menu__marca, .rodape__logo, .abertura')) continue;
    // imagens muito pequenas na tela (ícones) também não
    if (el.getBoundingClientRect().width < 60) continue;
    const ret = recortar(el, naPagina(el.getBoundingClientRect()));
    if (ret && area(ret) > 400) fotos.push({ el, ret });
  }

  // 2. Os textos: cada pedaço de texto (nó de texto), com o retângulo
  //    exato das letras (Range), não da caixa inteira
  const achados = [];
  const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const faixa = document.createRange();
  for (let n = andar.nextNode(); n; n = andar.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('script, style, noscript, .lightbox, dialog:not([open]), .sr-only, .visualmente-oculto')) continue;
    if (!visivel(el)) continue;
    faixa.selectNodeContents(n);
    for (const r of faixa.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      const ret = recortar(el, naPagina(r));
      if (!ret) continue;
      for (const f of fotos) {
        if (f.el.contains(el) || el.contains(f.el)) continue;
        const c = cruza(ret, f.ret);
        if (area(c) > 4) {
          achados.push({
            texto: n.textContent.trim().slice(0, 60),
            elemento: nome(el),
            dentroDe: nome(el.closest('header, section, article, footer, nav, div[class]') || el),
            foto: nome(f.el) + (f.el.alt ? ` (${f.el.alt.slice(0, 40)})` : ''),
            fixo: getComputedStyle(el.closest('.topo, .whats') || el).position === 'fixed',
          });
          break;
        }
      }
    }
  }
  // sem repetir o mesmo texto+foto
  const vistos = new Set();
  return achados.filter((a) => {
    const k = a.texto + '|' + a.foto;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
};

// Etiqueta do protótipo (v4.5: mora no topo, que tem fundo próprio).
// O conteúdo da página que passa POR BAIXO do topo já fica escondido pelo
// fundo do topo, então a conferência é: a etiqueta está inteira dentro do
// topo e não encosta em nada DO TOPO (logo, nome, Reservar, Menu).
const CHECAR_ETIQUETA = () => {
  const et = document.querySelector('.topo__prototipo');
  if (!et || !et.checkVisibility({ opacityProperty: true })) return { visivel: false, cobre: [] };
  const e = et.getBoundingClientRect();
  const t = document.getElementById('topo').getBoundingClientRect();
  const dentroDoTopo = e.top >= t.top && e.bottom <= t.bottom && e.left >= t.left && e.right <= t.right;
  const cobre = [];
  for (const el of document.querySelectorAll('#topo a, #topo button, #topo img, #topo span')) {
    if (el === et || et.contains(el) || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    const x = Math.min(e.right, r.right) - Math.max(e.left, r.left);
    const y = Math.min(e.bottom, r.bottom) - Math.max(e.top, r.top);
    if (x > 1 && y > 1 && (el.matches('a, button, img, input, select') || el.textContent.trim())) cobre.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
  }
  return { visivel: true, dentroDoTopo, caixa: `${Math.round(e.left)},${Math.round(e.top)} ${Math.round(e.width)}x${Math.round(e.height)}`, cobre: [...new Set(cobre)] };
};

// Rolagem lateral e títulos cortados pela máscara das linhas
const CHECAR_LAYOUT = () => {
  const painel = document.querySelector('.painel:not([hidden])');
  const linhasCortadas = [...painel.querySelectorAll('.linha')]
    .filter((l) => l.firstElementChild && l.firstElementChild.scrollWidth > l.clientWidth + 1)
    .map((l) => l.textContent.trim());
  // quantas linhas o título da abertura ocupa (regra: 2 no computador, 3 no celular)
  const titulo = painel.querySelector('header h1, header h2');
  // linhas = altura do título ÷ altura de uma linha
  const linhasTitulo = titulo ? Math.round(titulo.getBoundingClientRect().height / parseFloat(getComputedStyle(titulo).lineHeight)) : 0;
  return {
    rolagemLateral: document.documentElement.scrollWidth > innerWidth,
    linhasCortadas,
    tituloAbertura: titulo?.textContent.replace(/\s+/g, ' ').trim(),
    linhasTitulo,
    tamanhoTitulo: titulo ? getComputedStyle(titulo).fontSize : null,
  };
};

const relatorio = { geradoEm: new Date().toISOString(), endereco: URL_BASE, telas: {} };
const browser = await chromium.launch();

for (const [largura, altura] of [
  [390, 844],
  [1440, 900],
]) {
  const r = (relatorio.telas[`${largura}x${altura}`] = { abas: {}, erros: [] });
  const contexto = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: largura < 900 ? 2 : 1,
    hasTouch: largura < 900,
    locale: 'pt-BR',
  });
  await contexto.addInitScript(() => (window.open = () => null));

  for (const [i, id] of ABAS.entries()) {
    // página nova para cada aba: abre direto no endereço da aba (#id),
    // com a entrada completa do site, como quem recebe o link
    const page = await contexto.newPage();
    page.on('pageerror', (e) => r.erros.push(`${id}: ${e}`));
    await page.goto(`${URL_BASE}#${id}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: 12000 }).catch(() => {});
    await espera(2600); // animações da abertura da aba terminam

    // etiqueta logo no começo (quando ela está na tela)
    const etiquetaInicio = await page.evaluate(CHECAR_ETIQUETA);
    const n = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: path.join(PASTA_PRINTS, `${largura}-${n}-${id}.png`) });

    await page.evaluate(MONTAR_TUDO);
    await espera(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await espera(300);
    const sobreposicoes = await page.evaluate(CHECAR_SOBREPOSICAO);
    const layout = await page.evaluate(CHECAR_LAYOUT);

    // etiqueta no fim da página (rodapé tem texto e links embaixo)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await espera(600);
    const etiquetaFim = await page.evaluate(CHECAR_ETIQUETA);

    r.abas[id] = { sobreposicoes, total: sobreposicoes.length, ...layout, etiqueta: { inicio: etiquetaInicio, fimDaPagina: etiquetaFim } };
    if (id === ABAS[0]) await page.screenshot({ path: path.join(PASTA_PRINTS, `${largura}-99-rodape.png`) });
    await page.close();
  }
  await contexto.close();
}

// Etiqueta na tela mais estreita em que ela aparece (1100 px), topo grande e
// compacto: é onde o vão do meio do topo é menor
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.goto(`${URL_BASE}#eventos`, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: 12000 }).catch(() => {});
  await espera(1500);
  const grande = await page.evaluate(CHECAR_ETIQUETA);
  await page.evaluate(() => window.scrollTo(0, 300));
  await espera(400);
  await page.evaluate(() => window.scrollBy(0, -100)); // subir um pouco traz o topo (compacto) de volta
  await espera(900);
  const compacto = await page.evaluate(CHECAR_ETIQUETA);
  await page.screenshot({ path: path.join(PASTA_PRINTS, '1100-etiqueta-topo-compacto.png') });
  relatorio.etiqueta1100 = { topoGrande: grande, topoCompacto: compacto };
  await page.close();
}

// Blocos alterados além das aberturas:
//   - cartão de acomodação (contador e setas agora EMBAIXO da foto)
//   - cursor dos carrosséis (computador): só setas, sem a palavra
for (const [largura, altura] of [
  [390, 844],
  [1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: largura < 900 ? 2 : 1 });
  await page.goto(`${URL_BASE}#hospedagem`, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: 12000 }).catch(() => {});
  await page.evaluate(MONTAR_TUDO);
  await page.locator('#acomodacao-suite-dubai').scrollIntoViewIfNeeded();
  await espera(1500);
  await page.locator('#acomodacao-suite-dubai').screenshot({ path: path.join(PASTA_PRINTS, `${largura}-cartao-acomodacao.png`) });
  // a seta "próxima" anda o carrossel e o contador acompanha
  await page.click('#acomodacao-suite-dubai [data-proxima]');
  await espera(1200);
  relatorio[`cartao${largura}`] = await page.evaluate(() => document.querySelector('#acomodacao-suite-dubai [data-atual]').textContent);

  if (largura >= 900) {
    await page.goto(`${URL_BASE}#eventos`, { waitUntil: 'load' });
    await espera(4500);
    await page.evaluate(MONTAR_TUDO);
    const trilho = page.locator('#eventos .arrastar__trilho').first();
    await trilho.scrollIntoViewIfNeeded();
    await espera(1200);
    const caixa = await trilho.boundingBox();
    await page.mouse.move(caixa.x + caixa.width * 0.3, caixa.y + caixa.height * 0.5);
    await espera(200);
    await page.mouse.move(caixa.x + caixa.width * 0.35, caixa.y + caixa.height * 0.5, { steps: 5 });
    await espera(800);
    await page.screenshot({ path: path.join(PASTA_PRINTS, `${largura}-cursor-carrossel.png`) });
    relatorio.cursorCarrossel = await page.evaluate(() => {
      const c = document.querySelector('#eventos .arrastar__cursor');
      return { texto: c.textContent.trim(), setas: c.querySelectorAll('svg').length, visivel: getComputedStyle(c).opacity };
    });
  }
  await page.close();
}

// "Menos movimento" ligado: a abertura já aparece pronta (sem esperar)
{
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await contexto.newPage();
  await page.goto(`${URL_BASE}#lazer`, { waitUntil: 'load' });
  await espera(400);
  relatorio.menosMovimento = await page.evaluate(() => {
    const caixa = document.querySelector('#lazer .abertura-aba__foto .foto__caixa');
    const linha = document.querySelector('#lazer .titulo-abertura .linha > span');
    return { recorteDaFoto: getComputedStyle(caixa).clipPath, transformDoTitulo: getComputedStyle(linha).transform };
  });
  await page.screenshot({ path: path.join(PASTA_PRINTS, '1440-menos-movimento-lazer.png') });
  await contexto.close();
}

// resumo no topo do relatório
relatorio.totalSobreposicoes = Object.values(relatorio.telas).reduce((s, t) => s + Object.values(t.abas).reduce((a, b) => a + b.total, 0), 0);
await writeFile(path.join(PASTA_PRINTS, 'sobreposicoes.json'), JSON.stringify(relatorio, null, 2));
console.log(`Sobreposições: ${relatorio.totalSobreposicoes}  →  ${path.join(PASTA_PRINTS, 'sobreposicoes.json')}`);

await browser.close();
servidor?.close();
