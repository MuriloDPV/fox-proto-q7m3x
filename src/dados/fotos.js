// CATÁLOGO DE FOTOS
// Cada foto do site, com:
//   src  -> o arquivo (importado: o Astro gera as versões otimizadas)
//   alt  -> descrição para leitores de tela e para quando a foto não carrega
//   real -> largura da foto ORIGINAL, antes do upscale. O componente
//           Foto usa isso para nunca mostrar a foto maior que 1,5× o
//           tamanho real dela (mais que isso, até o upscale fica feio).
//   telaCheia -> true só nas fotos com 1600 px ou mais DE VERDADE (sem
//           upscale). Só elas podem abrir uma aba em tela cheia; o
//           componente HeroAba recusa as outras na hora do build.
//
// Este arquivo é o "estoque" de fotos. QUAL foto vai em QUAL seção fica em
// src/dados/fotos-secoes.js (é lá que se troca a foto de um lugar do site).
//
// As fotos HD (src/assets/fotos-hd/) saem do scripts/upscale.mjs e têm o
// dobro da largura original. As grandes (src/assets/fotos/) são originais.
//
// import.meta.glob junta vários arquivos de uma vez: devolve um objeto
// { caminho: imagem }. "eager" = importa já (não sob demanda).
import { fotosDoQuarto } from './fotos-quartos.js';

const hd = import.meta.glob('../assets/fotos-hd/galeria/**/*.webp', { eager: true, import: 'default' });
const grandes = import.meta.glob('../assets/fotos/*.webp', { eager: true, import: 'default' });

// Procura a foto HD pelo caminho curto (ex.: 'estrutura/2025031417419703826')
function fotoHd(caminho, alt) {
  const src = hd[`../assets/fotos-hd/galeria/${caminho}.webp`];
  if (!src) throw new Error(`Foto HD não encontrada: ${caminho} (rode scripts/upscale.mjs)`);
  return { src, alt, real: src.width / 2 };
}

// Foto de quarto (pasta do motor de reservas, também HD: real = metade)
function fotoQuarto(slug, alt) {
  const src = fotosDoQuarto(slug)[0];
  if (!src) throw new Error(`Foto de quarto não encontrada: ${slug}`);
  return { src, alt, real: src.width / 2 };
}

function fotoGrande(nome, alt) {
  const src = grandes[`../assets/fotos/${nome}.webp`];
  if (!src) throw new Error(`Foto não encontrada: ${nome}`);
  return { src, alt, real: src.width, telaCheia: src.width >= 1600 };
}

export const FOTOS = {
  // ---------- grandes (1600 px ou mais, sem upscale): as únicas de tela cheia ----------
  // As quatro primeiras são o slideshow do site atual (1920 px).
  // quartoJanelao é a única foto grande da galeria de acomodações
  // (2373 px; arquivo original fotos-originais/acomodacoes/acomodacoes-007.webp).
  heroPatio: fotoGrande('hero-patio-iluminado', 'Pátio com pergolado iluminado por cordões de luz ao anoitecer'),
  piscinaCascata: fotoGrande('piscina-cascata', 'Piscina azul com cascata entre pedras e capim florido em primeiro plano'),
  porDoSolCampo: fotoGrande('por-do-sol-lago', 'Pôr do sol alaranjado refletido na água, com capim em primeiro plano'),
  porDoSolFlores: fotoGrande('por-do-sol-flores', 'Céu de fim de tarde sobre os campos, com flores vermelhas em primeiro plano'),
  quartoJanelao: fotoGrande('quarto-janelao', 'Acomodação com janelas de vidro do chão ao teto, luminárias de palha e a mata do lado de fora'),

  // ---------- estrutura ----------
  patioMesas: fotoHd('estrutura/2025031417419660632', 'Mesas e cadeiras de madeira no pátio de tijolos sob o pergolado'),
  recreacao: fotoHd('estrutura/2025031417419660633', 'Espaço de recreação com escorregador, casinhas e brinquedos coloridos'),
  patioLanterna: fotoHd('estrutura/2025031417419660634', 'Pátio coberto com lanterna antiga, mesas e canteiros de arbustos'),
  patioTarde: fotoHd('estrutura/2025031417419660635', 'Pátio com pergolado, mesas e vasos no fim da tarde'),
  aguaPatos: fotoHd('estrutura/2025031417419703571', 'Patos nadando na água que reflete o céu do entardecer'),
  campoCapim: fotoHd('estrutura/2025031417419703573', 'Capim alto contra o céu vermelho do pôr do sol'),
  aguaReflexo: fotoHd('estrutura/2025031417419703574', 'Céu laranja e rosa espelhado na água parada'),
  patosVaso: fotoHd('estrutura/2025031417419703575', 'Dois patos sobre um vaso de pedra diante do pôr do sol'),
  aerea1: fotoHd('estrutura/2025031417419703693', 'Vista aérea com piscinas, telhados das acomodações e mata ao redor'),
  aerea2: fotoHd('estrutura/2025031417419703694', 'Vista aérea das construções, piscina e palmeiras'),
  jardimCoberto: fotoHd('estrutura/2025031417419703823', 'Jardim coberto com vasos de plantas e cadeira branca de ferro'),
  aguaDia: fotoHd('estrutura/2025031417419703824', 'Água tranquila sob o céu azul, com campos e árvores ao fundo'),
  florCacto: fotoHd('estrutura/2025031417419703825', 'Flor amarela de cacto aberta, vista de perto'),
  tresFiguras: fotoHd('estrutura/2025031417419703826', 'Escultura de três figuras em fila entre canteiros floridos'),
  pergoladoJardim: fotoHd('estrutura/2025031417419703827', 'Caminho de pedrisco sob pergolado coberto de folhagem'),
  leitores: fotoHd('estrutura/2025031417419703828', 'Escultura de três figuras segurando livros, num jardim de pedras'),
  jardimSuspenso: fotoHd('estrutura/2025031417419703829', 'Plantas pendentes e vasos num jardim coberto, com bancos brancos'),

  // ---------- café da manhã ----------
  cafePaes: fotoHd('cafe/2025031417419660251', 'Pães, bolachas e doces em suportes de metal dourado'),
  cafeFrutas: fotoHd('cafe/2025031417419660252', 'Mesa de café com frutas, frios, queijos e pães'),
  cafeSalao: fotoHd('cafe/2025031417419660253', 'Mesa do café da manhã montada junto à parede de tijolos'),
  cafeBolos: fotoHd('cafe/2025031417419660254', 'Bolos caseiros e doces sobre a mesa do café'),
  cafeEspelho: fotoHd('cafe/2025031417419660255', 'Mesa de café com bolos, frutas e um espelho dourado ao fundo'),
  cafeMamao: fotoHd('cafe/2025031417419660256', 'Frutas fatiadas, bolos e pães na mesa do café da manhã'),

  // ---------- piscina ----------
  piscina1: fotoHd('piscina/2025031417419704123', 'Piscina com cascata de pedras e jatos de água'),
  piscina2: fotoHd('piscina/2025031417419704125', 'Água caindo das pedras na piscina azul'),
  piscina3: fotoHd('piscina/2025031417419704126', 'Jatos de água na parte rasa da piscina, com a cascata ao fundo'),
  piscina4: fotoHd('piscina/2025031417419704127', 'Piscina com cascata e capim florido na borda'),
  piscina5: fotoHd('piscina/2025031417419704128', 'Cascata da piscina cercada de flores e arbustos'),

  // ---------- fachadas, detalhes e fotos menores do slideshow ----------
  chaleCasinhas: fotoHd('extras/acomodacoes-001', 'Casinhas de passarinho coloridas penduradas diante de um chalé de tijolos'),
  chaleJardim: fotoHd('extras/acomodacoes-008', 'Chalé de tijolos com jardim de folhagens roxas na frente'),
  chaleGramado: fotoHd('extras/acomodacoes-009', 'Chalé de tijolos com telhado de telhas sobre o gramado'),
  casaPorDoSol: fotoHd('extras/acomodacoes-012', 'Casa de tijolos com varanda iluminada pelo sol da tarde'),
  fachada: fotoHd('extras/acomodacoes-013', 'Entrada de tijolos com banco de ferro e luminária na parede'),
  espelhos: fotoHd('extras/acomodacoes-034', 'Espelhos de molduras douradas trabalhadas numa parede de tijolo à vista'),
  vistaAerea: fotoHd('extras/vista-aerea-hotel', 'Vista aérea da chácara com piscina, construções e jardins'),
  macarons: fotoHd('extras/macarons', 'Mesa de doces com torre de macarons, flores e arranjos'),
  piscinaNoite: fotoHd('extras/piscina-noite', 'Piscina à noite refletindo as luzes das construções'),

  // ---------- quartos (primeira foto da acomodação no motor de reservas) ----------
  // v4.2: usada na abertura C do Início ("Estadia")
  suiteDubai: fotoQuarto('suite-dubai', 'Suíte Dubai: cama com almofadas listradas, abajures e quadros dourados na parede clara'),
};
