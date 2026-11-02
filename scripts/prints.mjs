// Prints de verificação da v4 (390px e 1440px) + checagens automáticas.
// Usa o site já gerado em dist/. Salva em prints/<versão>/ (padrão: v4).
// Rodar:  npm run build  &&  npm run prints
//    ou:  npm run build  &&  npm run prints -- v4.1   (salva em prints/v4.1/)
// (o script da v3 está guardado em _versao-3/sobras/prints-v3.mjs)
//
// Para não abrir sites de verdade durante o teste, trocamos window.open
// por uma função que só ANOTA o endereço. Assim dá para conferir se a
// busca monta a URL certa do motor e se o formulário monta a mensagem
// certa do WhatsApp, sem sair da página.
import http from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const PASTA_SITE = path.resolve('dist');
const VERSAO = process.argv[2] || 'v4'; // nome da pasta dentro de prints/
const PASTA_PRINTS = path.resolve('prints', VERSAO);
const PORTA = 4399;
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

const ABAS = ['inicio', 'hospedagem', 'jardim-de-esculturas', 'eventos', 'gastronomia', 'lazer', 'visite'];
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const relatorio = {};
const browser = await chromium.launch();

// Mostra tudo que só apareceria ao rolar (títulos, fotos, blocos, números)
const MONTAR_TUDO = async () => {
  document.querySelectorAll('[data-linhas], [data-revelar], [data-surgir]').forEach((el) => el.classList.add('visivel'));
  document.querySelectorAll('[data-contar]').forEach((n) => (n.textContent = n.dataset.contar));
  const fotos = [...document.querySelectorAll('.painel:not([hidden]) img, .rodape img')];
  fotos.forEach((img) => (img.loading = 'eager'));
  await Promise.all(fotos.map((img) => img.decode().catch(() => {})));
};

// Anota em vez de abrir (ver comentário no topo)
const ANOTAR_ABERTURAS = () => {
  window.__abertos = [];
  window.open = (url) => {
    window.__abertos.push(String(url));
    return null;
  };
};

// CONFERÊNCIAS QUE RODAM DENTRO DA PÁGINA (aba visível)
const CONFERIR_ABA = () => {
  const painel = document.querySelector('.painel:not([hidden])');

  // 1. Rolagem lateral: nada pode passar da largura da tela
  //    (carrosséis e filtros rolam para o lado de propósito)
  const vazando = [...painel.querySelectorAll('*'), ...document.querySelectorAll('.topo *, .rodape *')]
    .filter((el) => {
      if (el.closest('.arrastar__trilho, .fotos__trilho, .filtros, svg, iframe, .heroi-aba__foto')) return false;
      const c = el.getBoundingClientRect();
      return c.width > 0 && c.right > innerWidth + 1;
    })
    .slice(0, 5)
    .map((el) => `${el.tagName}.${el.className}`);
  const rolagem = document.documentElement.scrollWidth > innerWidth ? ['página mais larga que a tela', ...vazando] : vazando;

  // 2. Títulos por linha: o texto não pode ser cortado pela máscara
  const linhasCortadas = [...painel.querySelectorAll('.linha')]
    .filter((l) => l.firstElementChild.scrollWidth > l.clientWidth + 1)
    .map((l) => l.textContent.trim());

  // 3. Fotos esticadas: tamanho exibido ÷ tamanho ORIGINAL da foto.
  //    object-fit: cover → vale o maior dos dois lados. A foto de abertura
  //    tem scale(1.12) por causa do parallax.
  const fotos = [...painel.querySelectorAll('img[data-real]')]
    .filter((img) => img.offsetWidth > 0)
    .map((img) => {
      const real = +img.dataset.real;
      const realAltura = +img.dataset.realAltura;
      const telaCheia = img.hasAttribute('data-tela-cheia');
      const escala = Math.max(img.offsetWidth / real, img.offsetHeight / realAltura) * (telaCheia ? 1.12 : 1);
      return {
        arquivo: decodeURIComponent((img.currentSrc || img.src).split('/').pop()).split('.')[0],
        real,
        exibida: `${img.offsetWidth}x${img.offsetHeight}`,
        escala: +escala.toFixed(2),
        telaCheia,
      };
    });
  const telaCheiaPequena = fotos.filter((f) => f.telaCheia && f.real < 1600);
  const esticadas = fotos.filter((f) => f.escala > 1.5);
  const maior = fotos.reduce((a, f) => (f.escala > a.escala ? f : a), { escala: 0 });

  return { rolagem: rolagem.length ? rolagem : 'ok', linhasCortadas, telaCheiaPequena, esticadas, maiorEscala: maior, fotosConferidas: fotos.length };
};

// Abre o menu e clica numa aba (o caminho de verdade, com a transição)
// (rolar um pouco para cima antes: o topo se esconde quando a página desce)
async function abrirAba(page, id) {
  await page.evaluate(() => window.scrollBy(0, -80));
  await espera(700);
  await page.click('[data-abrir-menu]');
  await espera(1000);
  await page.click(`#aba-${id}`);
  await espera(1700);
}

const rolarAte = (page, seletor, folga = 100) =>
  page.evaluate(
    ({ seletor, folga }) => window.scrollBy(0, document.querySelector(seletor).getBoundingClientRect().top - folga),
    { seletor, folga },
  );

for (const [largura, altura] of [
  [390, 844],
  [1440, 900],
]) {
  const p = (nome) => path.join(PASTA_PRINTS, `${largura}-${nome}.png`);
  const r = (relatorio[largura] = { erros: [] });
  const contexto = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: largura < 900 ? 2 : 1,
    hasTouch: largura < 900,
    locale: 'pt-BR',
  });
  await contexto.addInitScript(ANOTAR_ABERTURAS);
  const page = await contexto.newPage();
  page.on('console', (m) => m.type() === 'error' && r.erros.push(m.text()));
  page.on('pageerror', (e) => r.erros.push(String(e)));

  // ---------- Abertura do site ----------
  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await espera(800); // a logo já apareceu, o arco ainda não abriu
  await page.screenshot({ path: p('00-tela-de-abertura') });
  // v4.3: a entrada dura ~3 s contados da 1ª pintura (que, sem cache, pode
  // demorar 1 s por causa das fontes): espera ela terminar em vez de um tempo fixo
  await page
    .waitForFunction(() => !document.documentElement.classList.contains('entrando'), null, { timeout: 9000 })
    .catch(() => {});
  r.aberturaRemovida = await page.evaluate(() => !document.getElementById('abertura'));

  // ---------- Cada aba: abertura (tela) + aba inteira ----------
  r.abas = {};
  for (const [i, id] of ABAS.entries()) {
    if (i > 0) await abrirAba(page, id);
    else await espera(600);
    const n = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: p(`${n}-${id}`) });
    // qual abertura a aba usa (v4.1) e se o topo está certo para ela:
    // na dividida (fundo claro) o topo tem que estar sólido (texto escuro)
    const estadoAbertura = await page.evaluate(() => ({
      abertura: document.querySelector('.painel:not([hidden]) .heroi-dividido') ? 'dividida' : 'tela-cheia',
      topoSolido: document.getElementById('topo').classList.contains('topo--solido'),
    }));

    await page.evaluate(MONTAR_TUDO);
    await espera(1800);
    r.abas[id] = { ...estadoAbertura, ...(await page.evaluate(CONFERIR_ABA)) };
    r.abas[id].telas = await page.evaluate((id) => +(document.getElementById(id).offsetHeight / innerHeight).toFixed(1), id);
    await page.screenshot({ path: p(`${n}-${id}-inteira`), fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await espera(300);
  }

  // ---------- Rodapé (v4.1): telefones e horários não podem quebrar no meio ----------
  await page.evaluate(() => document.querySelector('.rodape').scrollIntoView());
  await espera(600);
  await page.locator('.rodape').screenshot({ path: p('28-rodape') });
  r.rodapeNumerosInteiros = await page.evaluate(() =>
    [...document.querySelectorAll('.rodape__sem-quebra')].map((n) => ({ texto: n.textContent, umaLinha: n.getClientRects().length === 1 })),
  );

  // logo da chácara no topo e no rodapé (depois das abas: a do rodapé só
  // carrega quando chega perto da tela, e o MONTAR_TUDO já a carregou)
  r.logos = await page.evaluate(() => ({
    topo: [...document.querySelectorAll('.topo__logo img')].some((i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity !== '0'),
    rodape: !!document.querySelector('.rodape .rodape__logo')?.naturalWidth,
  }));

  // ---------- Menu aberto (no computador, com o mouse em "Lazer") ----------
  await page.evaluate(() => window.scrollTo(0, 0));
  await espera(500);
  await page.click('[data-abrir-menu]');
  await espera(1300);
  if (largura >= 900) {
    await page.hover('#aba-lazer');
    await espera(1000);
  }
  r.menu = await page.evaluate(() => {
    const corpo = document.querySelector('.menu__corpo');
    const reservar = document.querySelector('.menu__rodape .botao').getBoundingClientRect();
    return {
      aberto: !document.getElementById('menu').hidden,
      expanded: document.querySelector('[data-abrir-menu]').getAttribute('aria-expanded'),
      paginaInert: document.querySelector('.palco').inert,
      fotoAtiva: document.querySelector('.menu__foto.ativa')?.dataset.menuFoto,
      // v4.1: nenhum contato passa da borda direita
      contatosDentro: [...document.querySelectorAll('.menu__contatos li')].every((li) => li.getBoundingClientRect().right <= innerWidth),
      // v4.1: o botão Reservar aparece inteiro sem rolar o menu
      reservarInteiro: reservar.top >= 0 && reservar.bottom <= innerHeight,
      menuSemRolagem: corpo.scrollHeight <= corpo.clientHeight + 1,
    };
  });
  await page.screenshot({ path: p('20-menu-aberto') });
  // computador: foto de uma aba de abertura dividida no menu (inteira,
  // sem cobrir a coluna, para não esticar)
  if (largura >= 900) {
    await page.hover('#aba-gastronomia');
    await espera(1000);
    r.menuFotoContida = await page.evaluate(() => {
      const img = document.querySelector('.menu__foto.ativa');
      const s = getComputedStyle(img);
      // largura em que a foto aparece de fato (caixa menos o respiro dos lados)
      const exibida = img.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      return { aba: img.dataset.menuFoto, objectFit: s.objectFit, larguraExibida: Math.round(exibida), maximo: s.getPropertyValue('--max-foto') };
    });
    await page.screenshot({ path: p('20b-menu-gastronomia') });
  }

  // Teclado no menu: ↓ move o foco, Enter abre a aba; Esc fecha
  await page.focus('#aba-visite');
  await page.keyboard.press('ArrowDown'); // volta ao começo (Início), é circular
  r.tecladoSetaFoco = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press('ArrowDown'); // Hospedagem
  await page.keyboard.press('Enter');
  await espera(1700);
  r.tecladoEnterAbriu = await page.evaluate(() => ({ hash: location.hash, menuFechado: document.getElementById('menu').hidden }));
  await espera(300);
  await page.click('[data-abrir-menu]');
  await espera(900);
  await page.keyboard.press('Escape');
  await espera(1100);
  r.escFechaMenu = await page.evaluate(() => document.getElementById('menu').hidden && document.activeElement.matches('[data-abrir-menu]'));

  // ---------- Hospedagem: as 22 acomodações e os filtros ----------
  r.acomodacoes = await page.evaluate(() => document.querySelectorAll('#grade-acomodacoes [data-etiquetas]').length);
  await rolarAte(page, '.filtros', 120);
  await page.click('[data-filtro="hidro"]');
  await espera(1400);
  await page.evaluate(MONTAR_TUDO);
  await espera(1600);
  r.filtroHidro = await page.evaluate(() => ({
    visiveis: [...document.querySelectorAll('#grade-acomodacoes [data-etiquetas]')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent),
    contador: document.querySelector('[data-contador]').textContent.trim(),
  }));
  await rolarAte(page, '.filtros', 120);
  await espera(500);
  await page.screenshot({ path: p('21-hospedagem-filtro-hidromassagem') });
  await page.click('[data-filtro="familia"]');
  await espera(1400);
  r.filtroFamilia = await page.evaluate(() =>
    [...document.querySelectorAll('#grade-acomodacoes [data-etiquetas]')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent),
  );

  // carrossel do cartão: próxima foto
  await page.click('[data-filtro="todas"]');
  await espera(1200);
  await rolarAte(page, '#acomodacao-suite-dubai');
  await page.evaluate(MONTAR_TUDO);
  await page.click('#acomodacao-suite-dubai [data-proxima]');
  await espera(900);
  r.carrosselContador = await page.evaluate(() => document.querySelector('#acomodacao-suite-dubai [data-atual]').textContent);

  // "Ver datas" abre a janela com o nome e os hóspedes
  await page.click('#acomodacao-suite-dubai [data-abrir-busca]');
  await espera(900);
  r.janelaVerDatas = await page.evaluate(() => ({
    aberta: document.getElementById('reservar').open,
    texto: document.querySelector('[data-reservar-acomodacao]').textContent,
    hospedes: document.querySelector('#busca-janela-hospedes').value,
  }));
  await page.screenshot({ path: p('22-ver-datas-janela') });

  // Busca: datas escolhidas → URL do motor
  await page.fill('#busca-janela-checkin', '2027-03-12');
  await page.fill('#busca-janela-checkout', '2027-03-14');
  await page.click('#reservar button[type="submit"]');
  await espera(400);
  r.buscaUrl = await page.evaluate(() => window.__abertos.at(-1));
  r.buscaOk = r.buscaUrl === 'https://www.chacaraludwig.com.br/search/2027-03-12/2027-03-14/2';
  r.janelaFechouDepois = await page.evaluate(() => !document.getElementById('reservar').open);

  // "Reservar" do topo, de outra aba
  await abrirAba(page, 'lazer');
  await page.click('.topo__reservar');
  await espera(700);
  r.reservarDoTopo = await page.evaluate(() => document.getElementById('reservar').open);
  await page.keyboard.press('Escape');
  await espera(300);

  // Lightbox (parede de esculturas)
  await abrirAba(page, 'jardim-de-esculturas');
  await rolarAte(page, '.parede');
  await page.evaluate(MONTAR_TUDO);
  await espera(600);
  await page.click('.obra--1 .foto__caixa');
  await espera(1000);
  r.lightbox = await page.evaluate(() => ({
    aberto: document.getElementById('lightbox').open,
    contador: document.querySelector('.lightbox__contador').textContent,
  }));
  await page.screenshot({ path: p('23-lightbox') });
  await page.keyboard.press('Escape');
  await espera(300);

  // Carrossel "arraste" (computador: arrasta com o mouse)
  // (só o carrossel da aba visível: as abas escondidas também têm carrossel)
  const CARROSSEL = '.painel:not([hidden]) [data-arrastar] [data-trilho-arrastar]';
  await rolarAte(page, '.painel:not([hidden]) [data-arrastar]', 60);
  await espera(600);
  const trilho = await page.locator(CARROSSEL).first().boundingBox();
  if (largura >= 900) {
    await page.mouse.move(trilho.x + trilho.width * 0.6, trilho.y + trilho.height * 0.5);
    await espera(500);
    await page.screenshot({ path: p('24-carrossel-cursor-arraste') });
    await page.mouse.down();
    await page.mouse.move(trilho.x + trilho.width * 0.2, trilho.y + trilho.height * 0.5, { steps: 12 });
    await page.mouse.up();
    await espera(300);
  } else {
    await page.evaluate((sel) => (document.querySelector(sel).scrollLeft += 260), CARROSSEL);
    await espera(400);
  }
  r.carrosselArrastou = await page.evaluate((sel) => document.querySelector(sel).scrollLeft > 50, CARROSSEL);
  r.lightboxNaoAbriuAoArrastar = await page.evaluate(() => !document.getElementById('lightbox').open);

  // ---------- Eventos: formulário de orçamento ----------
  await abrirAba(page, 'eventos');
  await page.click('.heroi-aba a[href="#orcar"]');
  await espera(1400);
  r.hashDepoisDeOrcar = await page.evaluate(() => location.hash);
  await page.selectOption('#orc-tipo', 'Casamento');
  await page.fill('#orc-data', '2027-05-22');
  await page.fill('#orc-convidados', '120');
  await page.fill('#orc-nome', 'Ana Souza');
  await page.evaluate(MONTAR_TUDO);
  await espera(1200);
  await rolarAte(page, '#orcar', 40);
  await espera(400);
  await page.screenshot({ path: p('25-formulario-evento') });
  await page.click('form[data-orcamento] button[type="submit"]');
  await espera(300);
  const urlWhats = await page.evaluate(() => window.__abertos.at(-1));
  const textoWhats = new URL(urlWhats).searchParams.get('text');
  r.orcamentoWhats = { numero: new URL(urlWhats).searchParams.get('phone'), texto: textoWhats };
  r.orcamentoOk =
    textoWhats.includes('Nome: Ana Souza') &&
    textoWhats.includes('Tipo de evento: Casamento') &&
    textoWhats.includes('Data pretendida: 22/05/2027') &&
    textoWhats.includes('Número de convidados: 120');

  // ---------- Visite: mapa e FAQ ----------
  await abrirAba(page, 'visite');
  await rolarAte(page, '.local', 20);
  await page.evaluate(MONTAR_TUDO);
  const quadro = page.frameLocator('iframe.mapa');
  await quadro.locator('body').waitFor({ timeout: 20000 }).catch(() => {});
  await espera(4500);
  r.mapaCarregou = await page.evaluate(() => {
    const f = document.querySelector('iframe.mapa');
    return !!f && f.getBoundingClientRect().height > 100;
  });
  r.mapaTexto = await page
    .frames()
    .find((f) => f.url().includes('google.com/maps'))
    ?.evaluate(() => document.body.innerText.slice(0, 120).replace(/\s+/g, ' '))
    .catch(() => 'sem acesso');
  await page.screenshot({ path: p('26-mapa') });

  await rolarAte(page, '[data-faq]', 120);
  await page.click('[data-faq] details:nth-of-type(3) summary');
  await espera(800);
  await page.click('[data-faq] details:nth-of-type(8) summary');
  await espera(800);
  r.faqAbertos = await page.evaluate(() => [...document.querySelectorAll('[data-faq] details[open] summary')].map((s) => s.textContent.trim()));
  await page.screenshot({ path: p('27-faq-aberto') });

  // ---------- Hash direto e botão voltar ----------
  await page.goto(`${URL_BASE}#eventos`);
  await espera(3200);
  const ativa = () => page.evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]').id);
  r.linkDiretoEventos = await ativa();
  await abrirAba(page, 'visite');
  await page.goBack();
  await espera(1600);
  r.depoisDoVoltar = await ativa();

  await contexto.close();

  // ---------- Menos movimento ----------
  const ctxCalmo = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: largura < 900 ? 2 : 1,
    reducedMotion: 'reduce',
  });
  await ctxCalmo.addInitScript(ANOTAR_ABERTURAS);
  const calma = await ctxCalmo.newPage();
  await calma.goto(`${URL_BASE}#inicio`);
  await espera(600);
  r.menosMovimento_semAbertura = await calma.evaluate(
    () => !document.getElementById('abertura') || getComputedStyle(document.getElementById('abertura')).display === 'none',
  );
  r.menosMovimento_numerosFinais = await calma.evaluate(() => [...document.querySelectorAll('#inicio [data-contar]')].every((n) => n.textContent === n.dataset.contar));
  await calma.click('[data-abrir-menu]');
  await espera(100);
  r.menosMovimento_menuImediato = await calma.evaluate(() => getComputedStyle(document.getElementById('menu')).clipPath);
  await calma.click('#aba-hospedagem');
  await espera(100);
  r.menosMovimento_trocaImediata = await calma.evaluate(
    () =>
      !document.getElementById('hospedagem').hidden &&
      document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().duration > 50).length === 0,
  );
  // tudo já visível, sem esperar rolagem (sem máscara, sem recorte, sem transparência)
  r.menosMovimento_tudoVisivel = await calma.evaluate(() =>
    [...document.querySelectorAll('#hospedagem [data-surgir], #hospedagem [data-revelar], #hospedagem [data-linhas] .linha > span')].every((el) => {
      const s = getComputedStyle(el);
      return s.opacity === '1' && (s.clipPath === 'none' || s.clipPath === 'inset(0px)') && s.transform === 'none';
    }),
  );
  await calma.screenshot({ path: p('30-menos-movimento-hospedagem') });
  r.menosMovimento_parallaxParado = await calma.evaluate(() => {
    window.scrollTo(0, 400);
    return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(getComputedStyle(document.querySelector('#hospedagem .heroi-aba')).getPropertyValue('--desloca') || 'sem parallax'))));
  });
  await ctxCalmo.close();
}

// ---------- Comparação: referência ao lado do nosso hero ----------
const LARG = 1440;
const ALT = 900;
const ref = await sharp('prints/referencia/1440-00-topo.png').resize(LARG, ALT, { fit: 'cover', position: 'top' }).toBuffer();
const nosso = await sharp(path.join(PASTA_PRINTS, '1440-01-inicio.png')).resize(LARG, ALT, { fit: 'cover', position: 'top' }).toBuffer();
const legenda = (texto) =>
  Buffer.from(
    `<svg width="${LARG}" height="70"><rect width="100%" height="100%" fill="#f4eee6"/><text x="24" y="44" font-family="Georgia" font-size="26" fill="#33271d">${texto}</text></svg>`,
  );
await sharp({ create: { width: LARG * 2 + 24, height: ALT + 70, channels: 3, background: '#f4eee6' } })
  .composite([
    { input: legenda('Referência: tengilemalamala.com'), left: 0, top: 0 },
    { input: legenda(`Chácara Ludwig ${VERSAO}`), left: LARG + 24, top: 0 },
    { input: ref, left: 0, top: 70 },
    { input: nosso, left: LARG + 24, top: 70 },
  ])
  .png()
  .toFile(path.join(PASTA_PRINTS, 'comparacao.png'));

await browser.close();
servidor.close();
console.log(JSON.stringify(relatorio, null, 1));
