// =========================================================
// TEMPOS DA ENTRADA DO SITE (v4.3) — O ÚNICO LUGAR PARA AJUSTAR
// =========================================================
// Tudo em milissegundos (1000 = 1 segundo).
//   atraso  = quanto a etapa espera antes de começar
//   duracao = quanto a etapa demora
// Quem lê este arquivo:
//   - src/components/Abertura.astro: a logo e o brilho (começam por CSS,
//     antes de o JS carregar, para a tela creme nunca ficar parada);
//   - src/scripts/entrada.js: todo o resto;
//   - src/layouts/Base.astro: o nome da "lembrança" da sessão.
//
// LINHA DO TEMPO DA PRIMEIRA VISITA (contando da primeira pintura da tela,
// com as fotos e as fontes já baixadas):
//      0 ms  tela creme
//     60     a logo começa a aparecer (700)
//    120     a linha dourada começa a carregar (no mínimo 800 ms)
//    300     o brilho dourado passa pela logo (1100)
//  ~1100     SAÍDA: o arco abre (1100) e a logo voa até o topo (950)
//  ~1320     cascata do Início: topo, título, frase, busca, fotos, legendas
//  ~3200     tudo no lugar
//
// PARA DEIXAR MAIS RÁPIDA: diminua ABERTURA.linha.minimo (o tempo da tela
// da logo), SAIDA.arco e SAIDA.voo (a saída) e as durações em CASCATA.
// MAIS LENTA: o contrário. Para mexer só na versão curta (segunda visita e
// volta para o Início), use RITMO_CURTO.

// ---- 1. Tela de abertura (a logo no meio da tela creme) ----
export const ABERTURA = {
  logo: { atraso: 60, duracao: 700 }, // a logo sobe um pouco e aparece
  brilho: { atraso: 300, duracao: 1100 }, // a faixa de luz atravessa a logo
  linha: {
    atraso: 120, // quando a linha de carregamento começa
    minimo: 800, // ela nunca enche mais rápido que isso (mesmo com tudo no cache)
    maximo: 2400, // se as fotos demorarem, depois disso segue assim mesmo
  },
  pausa: 80, // respiro entre a linha completar e a saída começar
};

// ---- 2. Saída da tela de abertura ----
export const SAIDA = {
  arco: { atraso: 0, duracao: 1100 }, // o papel creme abre em arco, do centro
  voo: { atraso: 40, duracao: 950 }, // a logo encolhe e voa até o topo
  recorte: { atraso: 40, duracao: 600 }, // v4.4: o nome embaixo do brasão some, de baixo para cima, durante o voo
  troca: 60, // depois do pouso, a logo que voou dá lugar à logo do topo (num quadro só)
  nome: { duracao: 600 }, // v4.4: depois da troca, o nome aparece ao lado do brasão do topo
  linha: { atraso: 0, duracao: 400 }, // a linha de carregamento recolhe
};

// ---- 3. Cascata do Início ----
// Os atrasos contam a partir do começo da cascata (a primeira peça começa
// em 0, para a versão curta já começar mexendo). Na primeira visita a
// cascata começa "inicio" ms depois da saída, com o arco ainda abrindo.
export const CASCATA = {
  inicio: 220,
  topoLinha: { atraso: 0, duracao: 900 }, // o filete do topo, do centro para as pontas
  rotulo: { atraso: 0, duracao: 750 }, // "Chácara Ludwig", em cima do título
  topoLogo: { atraso: 0, duracao: 600 }, // só na versão curta (na completa, a logo voa)
  titulo: {
    atraso: 80,
    duracao: 1050,
    entreLinhas: 110, // cada linha do título espera isso a mais que a anterior
    italico: 150, // e a linha em itálico, mais isso
  },
  fotos: {
    atraso: 200,
    duracao: 1100, // a foto abre de baixo para cima
    escala: 1300, // a foto "assenta" de 1,08 para 1 (um pouco mais longa)
    entreFotos: 160, // a escada: cada foto espera isso a mais que a anterior
  },
  topoBotoes: { atraso: 300, duracao: 750 }, // "Reservar" e "Menu"
  frase: { atraso: 380, duracao: 900 },
  busca: { atraso: 500, duracao: 900 },
  legenda: { depoisDaFoto: 450, duracao: 700 }, // a legenda entra depois da foto
  extras: { atraso: 900, duracao: 600 }, // botão do WhatsApp e etiqueta do protótipo
};

// ---- 4. Versão curta e pulo ----
// Versão curta (segunda visita na sessão, e quando se volta para o Início
// por outra aba): sem tela de abertura, só a cascata, com todos os tempos
// dela multiplicados por este número (0,6 = 40% mais rápida).
export const RITMO_CURTO = 0.6;

// Clicar, tocar, rolar ou apertar uma tecla durante a entrada: tudo o que
// falta termina em, no máximo, este tempo.
export const PULO = 380;

// ---- Curvas de velocidade (as mesmas do CSS do site) ----
export const CURVAS = {
  suave: 'cubic-bezier(0.22, 1, 0.36, 1)', // = --ease: sai rápido, pousa devagar
  mascara: 'cubic-bezier(0.7, 0, 0.2, 1)', // = --ease-mascara: textos e fotos que abrem
  arco: 'cubic-bezier(0.65, 0, 0.35, 1)', // começa e termina devagar
  voo: 'cubic-bezier(0.6, 0, 0.25, 1)', // decola devagar e pousa macio
};

// ---- Forma do arco da saída ----
export const ARCO = {
  proporcao: 1.3, // altura ÷ largura (portal: mais alto que largo)
  fio: 1.5, // espessura do fio dourado na borda do arco (px)
  quadros: 10, // quantas "fotos" do arco o JS calcula (o navegador preenche entre elas)
};

// Nome da "lembrança" que diz que a pessoa já viu a entrada completa nesta
// sessão (sessionStorage: some quando a aba do navegador é fechada).
export const CHAVE_SESSAO = 'ludwig-entrada-vista';
