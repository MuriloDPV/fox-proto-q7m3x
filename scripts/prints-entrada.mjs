// Verificação da v4.3: a entrada do site (tela de abertura + chegada do Início).
// Usa o site já gerado em dist/. Salva em prints/v4.3/:
//   entrada-1440.webm, entrada-390.webm   -> vídeo da primeira visita
//   entrada-curta-1440.webm               -> vídeo da segunda visita (versão curta)
//   quadro-03-1440.png ... quadro-final-390.png
//        -> a tela em 0,3 s / 1,0 s / 1,8 s / 2,5 s e no fim (03 = 0,3 s)
//   curta-*.png, pulo-*.png, menos-movimento-*.png, volta-inicio-1440.png
//   relatorio.json                        -> as conferências abaixo
// Rodar:  npm run build  &&  node scripts/prints-entrada.mjs
//
// Conferências:
//   - nenhum quadro do vídeo com a tela vazia depois que algo apareceu, e
//     nenhum salto brusco entre quadros (conteúdo aparecendo de uma vez);
//   - a logo chega ao topo sem salto: anda contínua, termina exatamente
//     em cima da logo do topo e nunca fica mais fraca na troca;
//   - sem rolagem lateral em nenhum momento; nada cortado no fim;
//   - layout sem pular (layout shift) durante a entrada;
//   - segunda visita = versão curta; clique/toque/rolagem pulam rápido;
//   - "menos movimento": sem tela de abertura e tudo no lugar;
//   - parallax das fotos depois da entrada (mouse e rolagem);
//   - voltar para o Início por outra aba repete a cascata curta.
import http from 'node:http';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const PASTA_SITE = path.resolve('dist');
const PASTA_PRINTS = path.resolve('prints', 'v4.3');
const PASTA_TEMP = path.join(os.tmpdir(), 'ludwig-entrada');
const PORTA = 4397;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Servidor estático mínimo para a pasta dist/
const servidor = http.createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  try {
    const arquivo = await readFile(path.join(PASTA_SITE, caminho));
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho)] || 'application/octet-stream' });
    res.end(arquivo);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => servidor.listen(PORTA, ok));
const URL_BASE = `http://localhost:${PORTA}/`;

await rm(PASTA_PRINTS, { recursive: true, force: true });
await mkdir(PASTA_PRINTS, { recursive: true });
await rm(PASTA_TEMP, { recursive: true, force: true });
await mkdir(PASTA_TEMP, { recursive: true });

const p = (nome) => path.join(PASTA_PRINTS, nome);
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const browser = await chromium.launch();
const relatorio = {};

const TELAS = {
  1440: { viewport: { width: 1440, height: 900 } },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// Roda na página ANTES dos scripts do site: a cada quadro anota onde estão
// a logo que voa e a logo do topo, a opacidade das duas, se há rolagem
// lateral e se a entrada ainda está rodando. Soma também o layout shift.
const INSTRUMENTO = () => {
  window.__amostras = [];
  window.__cls = 0;
  try {
    new PerformanceObserver((lista) =>
      lista.getEntries().forEach((e) => {
        if (e.hadRecentInput) return;
        window.__cls += e.value;
        // quem se mexeu (para achar a causa)
        (window.__mexeu ||= []).push(...e.sources.map((f) => `${Math.round(e.startTime)} ms: ${f.node?.className || f.node?.nodeName || '?'} ${e.value.toFixed(4)}`));
      }),
    ).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  const caixa = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width };
  };
  const opacidade = (el) => (el ? parseFloat(getComputedStyle(el).opacity) : 0);
  const amostrar = () => {
    const marca = document.querySelector('.abertura__marca');
    const topo = document.querySelector('[data-entrada="topo-logo"]');
    window.__amostras.push({
      t: performance.now(),
      marca: caixa(marca),
      marcaOp: marca ? opacidade(marca) * opacidade(marca.firstElementChild) : 0,
      topo: caixa(topo),
      topoOp: opacidade(topo),
      lateral: document.documentElement.scrollWidth - innerWidth,
      entrando: document.documentElement.classList.contains('entrando'),
    });
    // primeira peça da entrada em movimento (para medir a espera depois da 1ª pintura)
    if (window.__primeiraAnimacao == null && document.getAnimations().some((a) => a.playState === 'running')) {
      window.__primeiraAnimacao = performance.now();
    }
    if (performance.now() < 9000) requestAnimationFrame(amostrar);
  };
  requestAnimationFrame(amostrar);
};

// Espera a entrada acabar (o <html> perde .entrando)
const esperarFim = (page, limite = 9000) =>
  page.waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: limite });

// Os tempos contam da PRIMEIRA PINTURA da tela (antes dela o navegador
// ainda está baixando a página e o CSS; não é a entrada)
const esperarInstante = (page, ms) =>
  page.waitForFunction(
    (t) => {
      const fp = performance.getEntriesByName('first-paint')[0]?.startTime;
      return fp != null && performance.now() - fp >= t;
    },
    ms,
    { polling: 'raf', timeout: 15000 },
  );

// Estado final: tudo visível, nada cortado, sem rolagem lateral
const CONFERIR_FINAL = () => {
  const r = {};
  r.rolagemLateral = document.documentElement.scrollWidth > innerWidth;
  r.aberturaRemovida = !document.getElementById('abertura');
  r.classes = document.documentElement.className;
  r.pecasInvisiveis = [...document.querySelectorAll('[data-entrada]')]
    .filter((el) => el.getClientRects().length && parseFloat(getComputedStyle(el).opacity) < 0.99)
    .map((el) => el.dataset.entrada);
  r.animacoesRodando = document.getAnimations().filter((a) => a.playState === 'running').length;
  // título: o texto de cada linha inteiro dentro da "janela"
  r.tituloCortado = [...document.querySelectorAll('[data-entrada="titulo"] .linha')].some((linha) => {
    const j = linha.getBoundingClientRect();
    const t = linha.firstElementChild.getBoundingClientRect();
    return t.top < j.top - 0.5 || t.bottom > j.bottom + 0.5;
  });
  // peças saindo da tela pelos lados
  r.foraDaTela = [...document.querySelectorAll('[data-entrada]')]
    .filter((el) => {
      const b = el.getBoundingClientRect();
      return el.getClientRects().length && (b.left < -0.5 || b.right > innerWidth + 0.5);
    })
    .map((el) => el.dataset.entrada);
  r.fotosAbertas = [...document.querySelectorAll('[data-entrada="pilar"] .foto__caixa')].map((c) => getComputedStyle(c).clipPath);
  return r;
};

// Analisa as amostras do voo da logo
function analisarVoo(amostras) {
  const comMarca = amostras.filter((a) => a.marca);
  if (!comMarca.length) return { erro: 'sem logo voando' };
  const repouso = comMarca[0].marca;
  // passos entre quadros (px)
  const passos = [];
  for (let i = 1; i < comMarca.length; i++) {
    const a = comMarca[i - 1].marca;
    const b = comMarca[i].marca;
    passos.push({ t: comMarca[i].t, px: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  // salto = um passo bem maior que os vizinhos (e maior que 4 px)
  const saltos = passos.filter((s, i) => {
    const vizinho = Math.max(passos[i - 1]?.px ?? 0, passos[i + 1]?.px ?? 0);
    return s.px > 4 && s.px > vizinho * 2.5;
  });
  // o pouso: o último quadro em que a logo que voa ainda está inteira
  const inteiras = comMarca.filter((a) => a.marcaOp > 0.99);
  const pouso = inteiras.at(-1);
  // a logo nunca fica mais fraca: da hora em que aparece inteira até o fim,
  // a mais forte das duas está sempre em 100%
  const inicio = amostras.findIndex((a) => a.marcaOp > 0.99);
  const visivel = amostras.slice(inicio).map((a) => Math.max(a.marcaOp, a.topoOp));
  return {
    distanciaPercorrida: pouso ? Math.round(Math.hypot(pouso.marca.x - repouso.x, pouso.marca.y - repouso.y)) : null,
    maiorPassoPx: +Math.max(...passos.map((s) => s.px)).toFixed(1),
    saltos: saltos.map((s) => `${Math.round(s.t)} ms: ${s.px.toFixed(1)} px`),
    pousoDiferencaPx: pouso ? +Math.hypot(pouso.marca.x - pouso.topo.x, pouso.marca.y - pouso.topo.y).toFixed(2) : null,
    pousoEscala: pouso ? +(pouso.marca.w / pouso.topo.w).toFixed(3) : null,
    menorVisibilidadeNaTroca: +Math.min(...visivel).toFixed(3),
  };
}

// Extrai quadros do vídeo (20 por segundo) e procura tela vazia e saltos
async function analisarVideo(arquivo, nome) {
  const ffmpeg = (() => {
    const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
    if (!existsSync(base)) return null;
    return execFileSync('cmd', ['/c', 'dir', '/s', '/b', path.join(base, 'ffmpeg*.exe')], { encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
      .at(-1);
  })();
  if (!ffmpeg) return { erro: 'ffmpeg do Playwright não encontrado' };
  const pasta = path.join(PASTA_TEMP, nome);
  await mkdir(pasta, { recursive: true });
  execFileSync(ffmpeg, ['-loglevel', 'error', '-i', arquivo, '-r', '20', '-vf', 'scale=360:-1', path.join(pasta, '%04d.png')]);
  const arquivos = (await readdir(pasta)).sort();
  const quadros = [];
  for (const f of arquivos) {
    const img = sharp(path.join(pasta, f)).greyscale();
    const { channels } = await img.clone().stats();
    const { data } = await img.clone().raw().toBuffer({ resolveWithObject: true });
    quadros.push({ f, desvio: channels[0].stdev, media: channels[0].mean, data });
  }
  // o vídeo começa com a página em branco (antes de o site chegar):
  // conta a partir do primeiro quadro com algo desenhado
  const primeiro = quadros.findIndex((q) => q.desvio > 2);
  const vazios = quadros.slice(primeiro).filter((q) => q.desvio <= 2).map((q) => q.f);
  // diferença média entre quadros seguidos (0 a 255)
  const difs = [];
  for (let i = Math.max(1, primeiro); i < quadros.length; i++) {
    const a = quadros[i - 1].data;
    const b = quadros[i].data;
    let soma = 0;
    for (let k = 0; k < a.length; k++) soma += Math.abs(a[k] - b[k]);
    difs.push({ f: quadros[i].f, t: ((i / 20) * 1000) | 0, dif: +(soma / a.length).toFixed(2) });
  }
  const maiores = [...difs].sort((x, y) => y.dif - x.dif).slice(0, 5);
  return { quadros: quadros.length, primeiroComConteudo: quadros[primeiro]?.f, quadrosVazios: vazios, maioresDiferencas: maiores };
}

// =====================================================================
for (const [largura, opcoesTela] of Object.entries(TELAS)) {
  const r = (relatorio[largura] = { erros: [] });
  const ouvir = (page) => {
    page.on('console', (m) => m.type() === 'error' && r.erros.push(m.text()));
    page.on('pageerror', (e) => r.erros.push(String(e)));
  };

  // ---------- 1. Vídeo da primeira visita + instrumentos ----------
  const ctxVideo = await browser.newContext({
    ...opcoesTela,
    locale: 'pt-BR',
    recordVideo: { dir: PASTA_TEMP, size: opcoesTela.viewport },
  });
  await ctxVideo.addInitScript(INSTRUMENTO);
  const video = await ctxVideo.newPage();
  ouvir(video);
  await video.goto(URL_BASE);
  await esperarFim(video);
  r.duracaoEntradaMs = Math.round(
    await video.evaluate(() => {
      const fim = window.__amostras.find((a, i, l) => !a.entrando && l[i - 1]?.entrando)?.t ?? NaN;
      return fim - performance.getEntriesByName('first-paint')[0].startTime;
    }),
  );
  await espera(900);
  const amostras = await video.evaluate(() => window.__amostras);
  r.voo = analisarVoo(amostras);
  r.rolagemLateralDuranteEntrada = amostras.some((a) => a.lateral > 0);
  r.layoutShift = +(await video.evaluate(() => window.__cls)).toFixed(4);
  r.layoutShiftQuem = await video.evaluate(() => window.__mexeu || []);
  r.final = await video.evaluate(CONFERIR_FINAL);
  await video.screenshot({ path: p(`quadro-final-${largura}.png`) });

  // ---------- 2. Parallax das fotos (depois da entrada) ----------
  const transformes = () => video.evaluate(() => [...document.querySelectorAll('[data-entrada="pilar"]')].map((li) => li.style.transform || 'none'));
  if (largura === '1440') {
    await video.mouse.move(1400, 860, { steps: 8 });
    await espera(1300);
    r.parallaxMouse = await transformes();
    await video.mouse.move(720, 450, { steps: 8 });
    await espera(1500);
  } else {
    await video.evaluate(() => window.scrollTo(0, 220));
    await espera(400);
    r.parallaxRolagem = await transformes();
    await video.evaluate(() => window.scrollTo(0, 0));
    await espera(400);
  }

  // ---------- 3. Segunda visita na mesma sessão: versão curta ----------
  await video.reload();
  await espera(120);
  r.curta = await video.evaluate(() => ({
    classes: document.documentElement.className,
    telaDeAberturaVisivel: !!document.getElementById('abertura') && getComputedStyle(document.getElementById('abertura')).display !== 'none',
    animacoesRodando: document.getAnimations().length,
  }));
  const t0 = Date.now();
  await esperarFim(video);
  r.curta.duracaoMs = Date.now() - t0 + 120;
  // quanto tempo a tela fica parada entre a 1ª pintura e a 1ª peça se mexer
  r.curta.esperaAtePrimeiraPecaMs = await video.evaluate(() =>
    Math.round(window.__primeiraAnimacao - performance.getEntriesByName('first-paint')[0].startTime),
  );
  await espera(500);
  r.curta.final = await video.evaluate(CONFERIR_FINAL);

  // ---------- 4. Volta para o Início vindo de outra aba ----------
  if (largura === '1440') {
    await video.click('[data-entrada="pilar"] a');
    await espera(1400);
    r.voltaInicio = { abaDepoisDoClique: await video.evaluate(() => document.documentElement.dataset.aba) };
    await video.click('[data-entrada="topo-logo"]');
    await espera(250);
    r.voltaInicio.animacoesNoInicio = await video.evaluate(
      () => document.querySelector('[data-entrada="inicio"]').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    );
    await video.screenshot({ path: p('volta-inicio-meio-1440.png') });
    await espera(2200);
    r.voltaInicio.final = await video.evaluate(CONFERIR_FINAL);
    await video.screenshot({ path: p('volta-inicio-1440.png') });
  }

  await ctxVideo.close();
  await video.video().saveAs(p(`entrada-${largura}.webm`));
  await video.video().delete();
  r.video = await analisarVideo(p(`entrada-${largura}.webm`), `video-${largura}`);

  // ---------- 5. Quadros em momentos fixos (uma visita nova para cada) ----------
  r.quadros = {};
  for (const ms of [300, 1000, 1800, 2500]) {
    const ctx = await browser.newContext({ ...opcoesTela, locale: 'pt-BR' });
    const page = await ctx.newPage();
    ouvir(page);
    await page.goto(URL_BASE, { waitUntil: 'commit' }); // não espera o "load": o relógio conta da 1ª pintura
    await esperarInstante(page,ms);
    const nome = `quadro-${String(ms / 100).padStart(2, '0')}-${largura}.png`;
    r.quadros[nome] = await page.evaluate(() => ({
      msDesdeAPintura: Math.round(performance.now() - performance.getEntriesByName('first-paint')[0].startTime),
      lateral: document.documentElement.scrollWidth > innerWidth,
    }));
    await page.screenshot({ path: p(nome) });
    await ctx.close();
  }

  // ---------- 6. Pulo: clique (computador) ou toque (celular) ----------
  {
    const ctx = await browser.newContext({ ...opcoesTela, locale: 'pt-BR' });
    const page = await ctx.newPage();
    ouvir(page);
    await page.goto(URL_BASE, { waitUntil: 'commit' }); // não espera o "load": o relógio conta da 1ª pintura
    await esperarInstante(page,700);
    const antes = Date.now();
    if (largura === '1440') await page.mouse.click(700, 600);
    else await page.touchscreen.tap(195, 600);
    await espera(150);
    await page.screenshot({ path: p(`pulo-meio-${largura}.png`) });
    await esperarFim(page, 3000);
    r.puloClique = { terminouEmMs: Date.now() - antes, final: await page.evaluate(CONFERIR_FINAL) };
    await page.screenshot({ path: p(`pulo-final-${largura}.png`) });
    await ctx.close();
  }
  // pulo pela rolagem (roda do mouse), já no meio da cascata
  if (largura === '1440') {
    const ctx = await browser.newContext({ ...opcoesTela, locale: 'pt-BR' });
    const page = await ctx.newPage();
    ouvir(page);
    await page.goto(URL_BASE, { waitUntil: 'commit' }); // não espera o "load": o relógio conta da 1ª pintura
    await esperarInstante(page,1900);
    const antes = Date.now();
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 120);
    await esperarFim(page, 3000);
    r.puloRolagem = { terminouEmMs: Date.now() - antes };
    await ctx.close();
  }

  // ---------- 7. Versão curta: quadros ----------
  {
    const ctx = await browser.newContext({
      ...opcoesTela,
      locale: 'pt-BR',
      ...(largura === '1440' ? { recordVideo: { dir: PASTA_TEMP, size: opcoesTela.viewport } } : {}),
    });
    // simula "já viu nesta sessão"
    await ctx.addInitScript(() => sessionStorage.setItem('ludwig-entrada-vista', '1'));
    const page = await ctx.newPage();
    ouvir(page);
    await page.goto(URL_BASE, { waitUntil: 'commit' }); // não espera o "load": o relógio conta da 1ª pintura
    await esperarInstante(page,100);
    await page.screenshot({ path: p(`curta-01-${largura}.png`) });
    await esperarInstante(page, 300);
    await page.screenshot({ path: p(`curta-03-${largura}.png`) });
    await esperarFim(page);
    await espera(400);
    await page.screenshot({ path: p(`curta-final-${largura}.png`) });
    await ctx.close();
    if (largura === '1440') {
      await page.video().saveAs(p('entrada-curta-1440.webm'));
      await page.video().delete();
    }
  }

  // ---------- 8. "Menos movimento" ----------
  {
    const ctx = await browser.newContext({ ...opcoesTela, locale: 'pt-BR', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    ouvir(page);
    await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
    await espera(150);
    r.menosMovimento = await page.evaluate(() => {
      const ab = document.getElementById('abertura');
      return {
        telaDeAberturaVisivel: !!ab && getComputedStyle(ab).display !== 'none',
        classes: document.documentElement.className,
        pecasInvisiveis: [...document.querySelectorAll('[data-entrada]')]
          .filter((el) => el.getClientRects().length && parseFloat(getComputedStyle(el).opacity) < 0.99)
          .map((el) => el.dataset.entrada),
        tituloNoLugar: [...document.querySelectorAll('[data-entrada="titulo"] .linha > span')].every((s) => getComputedStyle(s).transform === 'none'),
        fotosAbertas: [...document.querySelectorAll('[data-entrada="pilar"] .foto__caixa')].every((c) => getComputedStyle(c).clipPath === 'none'),
        animacoesDaEntrada: document.getAnimations().filter((a) => a.effect?.getComputedTiming().duration > 50).length,
      };
    });
    if (largura === '1440') {
      await page.mouse.move(1400, 860, { steps: 6 });
      await espera(800);
      r.menosMovimento.parallax = await page.evaluate(() => [...document.querySelectorAll('[data-entrada="pilar"]')].map((li) => li.style.transform || 'none'));
    }
    await page.screenshot({ path: p(`menos-movimento-${largura}.png`) });
    await ctx.close();
  }
}

// ---------- 9. Chegando direto numa aba com foto grande (#eventos) ----------
{
  const ctx = await browser.newContext({ ...TELAS[1440], locale: 'pt-BR' });
  await ctx.addInitScript(INSTRUMENTO);
  const page = await ctx.newPage();
  await page.goto(`${URL_BASE}#eventos`, { waitUntil: 'commit' });
  await esperarInstante(page, 1900);
  await page.screenshot({ path: p('direto-eventos-meio-1440.png') });
  await esperarFim(page);
  await espera(1200);
  relatorio.diretoEventos = {
    voo: analisarVoo(await page.evaluate(() => window.__amostras)),
    final: await page.evaluate(() => ({
      aba: document.documentElement.dataset.aba,
      aberto: document.documentElement.classList.contains('aberto'),
      logoTopo: getComputedStyle(document.querySelector('[data-entrada="topo-logo"]')).opacity,
    })),
  };
  await page.screenshot({ path: p('direto-eventos-1440.png') });
  await ctx.close();
}

await browser.close();
servidor.close();
await writeFile(p('relatorio.json'), JSON.stringify(relatorio, null, 2));
await rm(PASTA_TEMP, { recursive: true, force: true });
console.log(JSON.stringify(relatorio, null, 2));
