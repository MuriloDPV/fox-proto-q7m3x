// Tempos da entrada. A marca central termina de desaparecer ANTES do arco.
export const ABERTURA = {
  logo: { atraso: 0, duracao: 300 },
  brilho: { atraso: 80, duracao: 450 },
  linha: { atraso: 40, minimo: 260, maximo: 900 },
  pausa: 0,
};
export const SAIDA = {
  centro: { atraso: 0, duracao: 140 },
  arco: { atraso: 160, duracao: 620 },
  linha: { atraso: 0, duracao: 120 },
};
export const CASCATA = {
  inicio: 180,
  topoLinha: { atraso: 0, duracao: 420 },
  rotulo: { atraso: 0, duracao: 400 },
  topoLogo: { atraso: 0, duracao: 360 },
  titulo: { atraso: 30, duracao: 520, entreLinhas: 45, italico: 30 },
  fotos: { atraso: 90, duracao: 560, escala: 640, entreFotos: 65 },
  topoBotoes: { atraso: 40, duracao: 360 },
  frase: { atraso: 80, duracao: 420 },
  busca: { atraso: 110, duracao: 420 },
  legenda: { depoisDaFoto: 200, duracao: 320 },
  extras: { atraso: 80, duracao: 360 },
};
export const RITMO_CURTO = 0.65;
export const LIMITE_ENTRADA = 2500;
export const CURVAS = {
  suave: 'cubic-bezier(0.22, 1, 0.36, 1)',
  mascara: 'cubic-bezier(0.7, 0, 0.2, 1)',
  arco: 'cubic-bezier(0.65, 0, 0.35, 1)',
};
export const ARCO = { proporcao: 1.3, fio: 1.5, quadros: 10 };
export const CHAVE_SESSAO = 'ludwig-entrada-vista';
