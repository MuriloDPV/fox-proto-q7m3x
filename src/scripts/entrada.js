// Entrada: a marca central desaparece sobre o fundo opaco; só depois
// o arco revela o site. A marca do cabeçalho permanece no seu lugar.
import { ABERTURA, SAIDA, CASCATA, RITMO_CURTO, LIMITE_ENTRADA, CURVAS, ARCO, CHAVE_SESSAO } from '../dados/entrada.js';

const raiz = document.documentElement;
const abertura = document.getElementById('abertura');
const preferenciaMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const menosMovimento = preferenciaMovimento.matches;
let avisarFim;
export const entradaTerminada = new Promise((ok) => (avisarFim = ok));
let terminou = false;
let limite;

// ---------------------------------------------------------------------
// Ferramentas
// ---------------------------------------------------------------------

// A lista permite cancelar a sequência inteira ao interagir com a página.
const novaLista = () => ({ animacoes: [] });

// Cria uma animação e guarda na lista.
// fill: 'both' = durante o atraso ela já segura o 1º quadro (a peça fica
// escondida) e, depois de terminar, segura o último (até a limpeza).
function animar(lista, el, quadros, { atraso = 0, duracao, curva = CURVAS.suave, pseudo }) {
  if (!el) return;
  const opcoes = { delay: atraso, duration: duracao, easing: curva, fill: 'both' };
  if (pseudo) opcoes.pseudoElement = pseudo;
  const animacao = el.animate(quadros, opcoes);
  lista.animacoes.push(animacao);
}

// Quando TODAS as animações da lista acabarem: cancela todas (a peça volta
// ao CSS normal) e roda "depois". allSettled = espera também as que
// forem canceladas no caminho.
function quandoTerminar(lista, depois) {
  Promise.allSettled(lista.animacoes.map((a) => a.finished)).then(() => {
    lista.animacoes.forEach((a) => a.cancel());
    depois?.();
  });
}

// ---------------------------------------------------------------------
// Chegada do Início, na primeira visita ou na recarga da mesma sessão.
// ---------------------------------------------------------------------
function cascata(lista, { inicio = 0, ritmo = 1, comTopo = true, logoDoTopo = false }) {
  const C = CASCATA;
  // atraso e duração finais de uma etapa (a versão curta multiplica por RITMO_CURTO)
  const tempo = (etapa, extra = 0) => ({
    atraso: inicio + (etapa.atraso + extra) * ritmo,
    duracao: etapa.duracao * ritmo,
  });
  const acender = [{ opacity: 0 }, { opacity: 1 }];
  const subir = (px) => [
    { opacity: 0, transform: `translateY(${px}px)` },
    { opacity: 1, transform: 'none' },
  ];

  if (comTopo) {
    document.querySelectorAll('[data-entrada="topo-botao"]').forEach((botao) => animar(lista, botao, acender, tempo(C.topoBotoes)));
    if (logoDoTopo) animar(lista, document.querySelector('[data-entrada="topo-logo"]'), acender, tempo(C.topoLogo));
    document.querySelectorAll('[data-entrada="extra"]').forEach((el) => animar(lista, el, acender, tempo(C.extras)));
  }

  // O resto é a abertura do Início; se a aba aberta é outra, para aqui
  const inicioAba = document.querySelector('[data-entrada="inicio"]');
  if (!inicioAba || !inicioAba.getClientRects().length) return;
  const peca = (nome) => inicioAba.querySelector(`[data-entrada="${nome}"]`);

  animar(lista, peca('rotulo'), subir(12), tempo(C.rotulo));

  // Título: cada linha sobe por trás da própria "janela" (a máscara de
  // baixo para cima já existe no CSS: .linha tem overflow: hidden).
  // A linha em itálico espera um pouco mais.
  inicioAba.querySelectorAll('[data-entrada="titulo"] .linha > span').forEach((texto, i) => {
    const extra = i * C.titulo.entreLinhas + (texto.querySelector('em') ? C.titulo.italico : 0);
    animar(lista, texto, [{ transform: 'translateY(110%)' }, { transform: 'none' }], tempo(C.titulo, extra));
  });

  animar(lista, peca('frase'), subir(10), tempo(C.frase));
  animar(lista, peca('busca'), subir(10), tempo(C.busca));
  inicioAba.querySelectorAll('[data-entrada="apoio"]').forEach((el) => animar(lista, el, subir(6), tempo(C.frase)));

  // As três fotos, em escada: a caixa abre de baixo para cima (clip-path),
  // a foto "assenta" de 1,04 para 1 e, depois, a legenda sobe.
  inicioAba.querySelectorAll('[data-entrada="pilar"]').forEach((pilar, i) => {
    const extra = i * C.fotos.entreFotos;
    const abrir = [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }];
    animar(lista, pilar.querySelector('.foto__caixa'), abrir, { ...tempo(C.fotos, extra), curva: CURVAS.mascara });
    animar(lista, pilar.querySelector('.foto__img'), [{ transform: 'scale(1.04)' }, { transform: 'none' }], {
      atraso: tempo(C.fotos, extra).atraso,
      duracao: C.fotos.escala * ritmo,
    });
    const legenda = { atraso: C.fotos.atraso + extra + C.legenda.depoisDaFoto, duracao: C.legenda.duracao };
    animar(lista, pilar.querySelector('.legenda'), subir(10), tempo(legenda));
  });
}

// ---------------------------------------------------------------------
// Primeira visita: marca central, saída em arco e conteúdo
// ---------------------------------------------------------------------
const entrada = novaLista();
let saiu = false;

function abrirCompleta() {
  // Lembra que já viu (try: em aba anônima ou com o armazenamento
  // bloqueado, sessionStorage pode dar erro; aí só não lembra)
  try {
    sessionStorage.setItem(CHAVE_SESSAO, '1');
  } catch {}

  // O que a linha espera: as fotos da primeira tela e as fontes
  const fotos = fotosDaPrimeiraTela();
  const total = fotos.length + 1;
  let prontos = 0;
  const marcar = () => prontos++;
  // decode(): avisa quando a foto já baixou E está pronta para desenhar
  // (se der erro, conta também: a linha não pode travar)
  fotos.forEach((foto) => foto.decode().then(marcar, marcar));
  // fonts.load() pede as fontes da primeira tela e avisa quando chegaram
  // (assim o título não troca de fonte e "pula" no meio da cascata)
  Promise.all(FONTES.map((fonte) => document.fonts.load(fonte))).then(marcar, marcar);

  // A cada quadro, a linha anda até o menor de dois valores:
  //   - quanto já carregou (prontos ÷ total);
  //   - um "relógio mínimo", de 0 a 1 em linha.minimo ms (desacelera no
  //     fim): mesmo com tudo no cache, ela não enche de uma vez.
  // Passou de linha.maximo: enche e segue, carregado ou não.
  const progresso = abertura.querySelector('.abertura__progresso');
  let comeco = null;
  let anterior = 0;
  let mostrado = 0;

  const passo = (agora) => {
    if (saiu) return; // o pulo já fez sair
    // o relógio começa no primeiro quadro desenhado de verdade (se o
    // navegador ainda espera o CSS das fontes, a tela nem pintou)
    if (comeco === null) comeco = anterior = agora;
    const tempo = agora - comeco - ABERTURA.linha.atraso;
    const x = Math.min(1, Math.max(0, tempo / ABERTURA.linha.minimo));
    const relogio = 1 - (1 - x) ** 2;
    const alvo = tempo >= ABERTURA.linha.maximo ? 1 : Math.min(prontos / total, relogio);
    // no máximo a barra inteira em 450 ms: quando uma foto chega, a linha
    // corre até lá, mas sem saltar
    mostrado = Math.min(alvo, mostrado + (agora - anterior) / 450);
    anterior = agora;
    progresso.style.transform = `scaleX(${mostrado})`;
    if (mostrado >= 1) setTimeout(sair, ABERTURA.pausa);
    else requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

// As fontes que aparecem na primeira tela (família e peso, como no CSS)
const FONTES = ['300 1em "Cormorant Garamond"', 'italic 300 1em "Cormorant Garamond"', '400 1em Inter', '500 1em Inter'];

// Fotos visíveis na primeira tela da aba aberta
function fotosDaPrimeiraTela() {
  return [...document.querySelectorAll('.painel img')].filter((foto) => {
    const caixa = foto.getBoundingClientRect();
    return caixa.width > 0 && caixa.top < innerHeight && caixa.bottom > 0;
  });
}

function sair() {
  if (saiu) return;
  saiu = true;
  // .aberto solta as animações em CSS das abas com foto grande, caso a
  // pessoa tenha chegado direto nelas (HeroAba.astro, HeroDividido.astro)
  raiz.classList.add('aberto');
  // daqui em diante a tela de abertura não segura mais cliques: eles
  // chegam ao site (o papel já está abrindo)
  abertura.style.pointerEvents = 'none';
  // Aguarda também as animações de apresentação já iniciadas pelo CSS.
  entrada.animacoes.push(...abertura.getAnimations({ subtree: true }));

  // 1. O ARCO. clip-path: polygon(evenodd, ...) desenha "a tela inteira
  //    MENOS o arco" — um buraco com forma de portal que cresce do centro.
  //    O fio dourado é a mesma coisa com o buraco ARCO.fio px menor, numa
  //    camada embaixo do papel: só aparece na borda.
  const tela = abertura.getBoundingClientRect();
  const arco = quadrosDoArco(tela.width, tela.height);
  const tempoArco = { ...SAIDA.arco, curva: CURVAS.arco };
  animar(entrada, abertura.querySelector('.abertura__papel'), arco.papel, tempoArco);
  animar(entrada, abertura.querySelector('.abertura__aro'), arco.fio, tempoArco);

  // 2. A linha de carregamento recolhe para a direita
  const recolher = [
    { opacity: 1, transform: 'none' },
    { opacity: 0, transform: 'scaleX(0)' },
  ];
  animar(entrada, abertura.querySelector('.abertura__linha'), recolher, { ...SAIDA.linha, curva: CURVAS.mascara });

  // A marca central não se desloca pela página. Ela sai enquanto o
  // fundo ainda é opaco, antes do primeiro quadro visível do portal.
  animar(entrada, abertura.querySelector('.abertura__centro'),
    [{ opacity: 1 }, { opacity: 0 }], SAIDA.centro);

  // 4. A cascata do Início começa com o arco ainda abrindo
  cascata(entrada, { inicio: CASCATA.inicio, logoDoTopo: true });

  quandoTerminar(entrada, terminar);
}

// Os quadros do arco. Para cada quadro: um polígono com o retângulo da
// tela (por fora) e o arco (por dentro); com "evenodd", o que fica dentro
// dos dois vira buraco. O arco vai de largura 0 (um ponto no centro) até
// o menor arco que cobre os quatro cantos da tela.
function quadrosDoArco(largura, altura) {
  const cx = largura / 2;
  const cy = altura / 2;

  // O arco de largura l: retângulo com o topo em meio-círculo, centrado
  // na tela. "recuo" = encolhe a forma por igual (para o fio dourado).
  const pontosDoArco = (l, recuo) => {
    const a = l * ARCO.proporcao;
    const raio = Math.max(0, l / 2 - recuo);
    const base = cy + Math.max(0, a / 2 - recuo);
    const centroCurva = cy - a / 2 + l / 2; // de onde sai o meio-círculo
    const pontos = [[cx - raio, base]];
    const lados = 40; // o meio-círculo vira 40 retinhas
    for (let i = 0; i <= lados; i++) {
      const angulo = Math.PI - (i / lados) * Math.PI; // 180° (esquerda) → 0° (direita), pelo topo
      pontos.push([cx + raio * Math.cos(angulo), Math.min(base, centroCurva - raio * Math.sin(angulo))]);
    }
    pontos.push([cx + raio, base]);
    return pontos;
  };

  // O arco cobre um ponto (x, y) da tela?
  const cobre = (l, x, y) => {
    const a = l * ARCO.proporcao;
    const centroCurva = cy - a / 2 + l / 2;
    if (Math.abs(x - cx) > l / 2 || y > cy + a / 2) return false;
    return y >= centroCurva || Math.hypot(x - cx, y - centroCurva) <= l / 2;
  };
  let final = largura;
  while (!cobre(final, 0, 0) || !cobre(final, 0, altura)) final *= 1.02;
  final *= 1.04; // folga: o fio dourado também sai inteiro da tela

  // "tela inteira" por fora (2 px além da borda) + o arco por dentro,
  // ligados por uma linha que vai e volta (some no evenodd)
  const poligono = (pontos) => {
    const px = (p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`;
    const fora = [
      [-2, altura + 2],
      [-2, -2],
      [largura + 2, -2],
      [largura + 2, altura + 2],
      [-2, altura + 2],
    ];
    return `polygon(evenodd, ${[...fora, ...pontos, pontos[0]].map(px).join(', ')})`;
  };

  const papel = [];
  const fio = [];
  for (let q = 0; q <= ARCO.quadros; q++) {
    const l = final * (q / ARCO.quadros);
    papel.push({ clipPath: poligono(pontosDoArco(l, 0)) });
    fio.push({ clipPath: poligono(pontosDoArco(l, ARCO.fio)) });
  }
  return { papel, fio };
}

// ---------------------------------------------------------------------
// Pular, terminar e começar
// ---------------------------------------------------------------------
const EVENTOS_DE_PULO = ['pointerdown', 'wheel', 'touchstart', 'keydown'];

// A primeira interação libera o site imediatamente, sem acelerar fases
// em ritmos diferentes (o que faria o arco ultrapassar o fade da marca).
function pular() { terminar(); }

function terminar() {
  if (terminou) return;
  terminou = true;
  saiu = true;
  clearTimeout(limite);
  entrada.animacoes.forEach((animacao) => animacao.cancel());
  abertura?.remove();
  raiz.classList.remove('entrando', 'entrada-completa', 'entrada-curta');
  raiz.classList.add('aberto');
  EVENTOS_DE_PULO.forEach((tipo) => window.removeEventListener(tipo, pular));
  window.removeEventListener('resize', pular);
  document.removeEventListener('entrada:expirada', terminar);
  document.removeEventListener('aba:trocada', aoNavegar);
  preferenciaMovimento.removeEventListener('change', pular);
  avisarFim();
}
const abaInicial = raiz.dataset.aba;
function aoNavegar(evento) {
  if (evento.detail.id !== abaInicial) terminar();
}

if (menosMovimento || !raiz.classList.contains('entrando') || !Element.prototype.animate) {
  terminar();
} else {
  limite = setTimeout(terminar, LIMITE_ENTRADA);
  EVENTOS_DE_PULO.forEach((tipo) => window.addEventListener(tipo, pular, { passive: true }));
  window.addEventListener('resize', pular, { passive: true });
  document.addEventListener('entrada:expirada', terminar);
  document.addEventListener('aba:trocada', aoNavegar);
  preferenciaMovimento.addEventListener('change', pular);
  try {
    if (abertura && raiz.classList.contains('entrada-completa')) {
      abrirCompleta();
    } else {
      raiz.classList.add('aberto');
      cascata(entrada, { ritmo: RITMO_CURTO, logoDoTopo: true });
      quandoTerminar(entrada, terminar);
    }
  } catch {
    terminar();
  }
}
// A volta ao Início usa a transição de seção existente. Não repete as
// máscaras da primeira visita nem esconde os botões novamente.
