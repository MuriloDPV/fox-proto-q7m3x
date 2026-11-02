// TROCA DE ABA COM CORTE LIMPO
// Uma função só, usada pela troca de abas. Recebe o palco e uma função que
// faz a troca de conteúdo (esconder um painel, mostrar outro).
//
// Caminho 1 — navegador com View Transitions (Chrome, Edge, Safari 18+,
//   Firefox 144+): document.startViewTransition() tira uma "foto" da tela
//   antiga, roda a troca e tira uma foto da nova. O CSS (global.css, procure
//   "TROCA DE ABA") faz a antiga sumir e revela a nova de baixo para cima.
// Caminho 2 — sem View Transitions: troca na hora e o palco aparece suave
//   (classe .entrando).
// Com "menos movimento" ligado no sistema: troca sem animação nenhuma.
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
let transicaoAtual = null;

export function trocarComTransicao(palco, trocar) {
  if (menosMovimento.matches) {
    trocar();
    return;
  }

  if (document.startViewTransition) {
    // Se a pessoa clicar em outra aba no meio da animação, pula para o fim
    transicaoAtual?.skipTransition();
    const transicao = document.startViewTransition(trocar);
    transicaoAtual = transicao;
    // pular a transição rejeita a promessa "ready": é esperado, não é erro
    transicao.ready.catch(() => {});
    transicao.finished.finally(() => {
      if (transicaoAtual === transicao) transicaoAtual = null;
    });
    return;
  }

  trocar();
  // Reinicia a animação: tira a classe, força o navegador a "perceber"
  // (ler offsetWidth recalcula o layout) e coloca de novo.
  palco.classList.remove('entrando');
  void palco.offsetWidth;
  palco.classList.add('entrando');
}

document.addEventListener('animationend', (evento) => {
  if (evento.animationName === 'aparecer-palco') evento.target.classList.remove('entrando');
});
