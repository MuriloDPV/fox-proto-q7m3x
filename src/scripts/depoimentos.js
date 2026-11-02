// DEPOIMENTOS: um de cada vez, dentro da moldura.
// Setas e losangos trocam; sozinho, troca a cada 8 s (para quando a
// pessoa passa o mouse, foca um botão ou pediu menos movimento).
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('[data-depoimentos]').forEach((carrossel) => {
  const itens = [...carrossel.querySelectorAll('[data-depoimento]')];
  const pontos = [...carrossel.querySelectorAll('[data-ponto]')];
  let atual = 0;
  let pausado = false;
  let ultimaTroca = Date.now();

  const mostrar = (novo) => {
    ultimaTroca = Date.now();
    atual = (novo + itens.length) % itens.length;
    itens.forEach((item, i) => (item.hidden = i !== atual));
    pontos.forEach((ponto, i) => ponto.setAttribute('aria-pressed', String(i === atual)));
    if (!menosMovimento.matches) {
      const item = itens[atual];
      item.classList.remove('revelar-local');
      void item.offsetWidth;
      item.classList.add('revelar-local');
    }
  };

  carrossel.querySelector('[data-anterior]').addEventListener('click', () => mostrar(atual - 1));
  carrossel.querySelector('[data-proximo]').addEventListener('click', () => mostrar(atual + 1));
  pontos.forEach((ponto, i) => ponto.addEventListener('click', () => mostrar(i)));

  carrossel.addEventListener('pointerenter', () => (pausado = true));
  carrossel.addEventListener('pointerleave', () => (pausado = false));
  carrossel.addEventListener('focusin', () => (pausado = true));
  carrossel.addEventListener('focusout', () => (pausado = false));

  // Confere a cada segundo. Só avança se a aba Depoimentos estiver visível
  // há 8 s (enquanto escondida, o relógio fica zerado).
  setInterval(() => {
    const escondido = carrossel.offsetParent === null;
    if (escondido || pausado) ultimaTroca = Date.now();
    if (escondido || pausado || menosMovimento.matches) return;
    if (Date.now() - ultimaTroca >= 8000) mostrar(atual + 1);
  }, 1000);
});
