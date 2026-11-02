// PERGUNTAS FREQUENTES: acordeão animado
// <details> abre e fecha sozinho, mas "pula" de altura. Aqui interceptamos
// o clique no <summary> e animamos a altura da resposta com a Web
// Animations API (elemento.animate), do 0 até a altura real e vice-versa.
// Com "menos movimento", deixa o <details> trabalhar sozinho.
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const SUAVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

document.querySelectorAll('[data-faq] details').forEach((item) => {
  const pergunta = item.querySelector('summary');
  const resposta = item.querySelector('.faq__resposta');
  let animacao = null;

  pergunta.addEventListener('click', (evento) => {
    if (menosMovimento.matches) return;
    evento.preventDefault();
    animacao?.cancel();

    if (item.open) {
      // fechar: da altura atual até 0, e só então tira o "open"
      animacao = resposta.animate([{ height: `${resposta.offsetHeight}px` }, { height: '0px' }], { duration: 380, easing: SUAVE });
      animacao.onfinish = () => (item.open = false);
    } else {
      // abrir: coloca o "open" (a resposta passa a existir), mede e anima de 0
      item.open = true;
      const altura = resposta.offsetHeight;
      animacao = resposta.animate(
        [
          { height: '0px', opacity: 0 },
          { height: `${altura}px`, opacity: 1 },
        ],
        { duration: 480, easing: SUAVE },
      );
    }
  });
});
