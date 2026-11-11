// Tempos da entrada. A marca central termina de desaparecer ANTES do arco.
export const ABERTURA = {
  logo: { atraso: 0, duracao: 400 },
  brilho: { atraso: 80, duracao: 600 },
  linha: { atraso: 40, minimo: 420, maximo: 900 },
  pausa: 0,
};
export const SAIDA = {
  centro: { atraso: 0, duracao: 220 },
  arco: { atraso: 240, duracao: 850 },
  linha: { atraso: 0, duracao: 180 },
};
export const CASCATA = {
  inicio: 260,
  topoLinha: { atraso: 0, duracao: 420 },
  rotulo: { atraso: 0, duracao: 480 },
  topoLogo: { atraso: 0, duracao: 480 },
  titulo: { atraso: 40, duracao: 620, entreLinhas: 60, italico: 40 },
  fotos: { atraso: 110, duracao: 680, escala: 800, entreFotos: 80 },
  topoBotoes: { atraso: 60, duracao: 440 },
  frase: { atraso: 100, duracao: 520 },
  busca: { atraso: 140, duracao: 520 },
  legenda: { depoisDaFoto: 240, duracao: 380 },
  extras: { atraso: 100, duracao: 440 },
};
export const RITMO_CURTO = 0.65;
export const LIMITE_ENTRADA = 2500;
// CELULAR (até 899 px): a entrada completa dura ~meio segundo a mais.
// No celular a tela é menor e tudo parecia corrido. O tempo extra é
// dividido em três partes: a linha enche mais devagar, a marca fica um
// instante parada com a linha cheia e o arco abre mais devagar.
// Os limites de segurança (LIMITE_ENTRADA aqui e o do <head> em
// Base.astro) crescem o mesmo tanto, senão cortariam a entrada no meio.
export const CELULAR = {
  midia: '(max-width: 899px)',
  linha: 250, // + ms no tempo mínimo da linha de carregamento
  pausa: 250, // + ms com a marca parada antes do arco
  arco: 150, // + ms na abertura do arco
  limite: 650, // + ms nos limites de segurança (soma dos três acima)
};
export const CURVAS = {
  suave: 'cubic-bezier(0.22, 1, 0.36, 1)',
  mascara: 'cubic-bezier(0.7, 0, 0.2, 1)',
  arco: 'cubic-bezier(0.65, 0, 0.35, 1)',
};
export const ARCO = { proporcao: 1.3, fio: 1.5, quadros: 10 };
export const CHAVE_SESSAO = 'ludwig-entrada-vista';
