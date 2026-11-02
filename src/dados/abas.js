// Lista única das abas do site. O menu em tela cheia, os painéis, os
// endereços (#hash) e os links do rodapé saem todos daqui. Para renomear
// uma aba, mude só aqui.
//   id    -> vira o endereço: chacaraludwig.../#eventos
//   nome  -> como aparece no menu, no rodapé e para leitores de tela
//   secao -> chave da aba em src/dados/fotos-secoes.js (a foto de abertura
//            dela também aparece no menu, quando o mouse passa no nome)
export const ABAS = [
  { id: 'inicio', nome: 'Início', secao: 'inicio' },
  { id: 'hospedagem', nome: 'Hospedagem', secao: 'hospedagem' },
  { id: 'jardim-de-esculturas', nome: 'Jardim de Esculturas', secao: 'jardim' },
  { id: 'eventos', nome: 'Eventos', secao: 'eventos' },
  { id: 'gastronomia', nome: 'Gastronomia', secao: 'gastronomia' },
  { id: 'lazer', nome: 'Lazer', secao: 'lazer' },
  { id: 'visite', nome: 'Visite', secao: 'visite' },
];
