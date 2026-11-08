// CARROSSEL "ARRASTE" (src/components/Arrastar.astro)
// No celular, a fileira já rola com o dedo (overflow-x). Aqui entram só os
// extras do computador:
//   1. arrastar com o mouse: segurou o botão e moveu, a fileira acompanha;
//   2. o círculo "Arraste" que segue o mouse em cima das fotos;
//   3. a linha de progresso embaixo (quanto da fileira já foi visto).
// Se a pessoa arrastou, o clique que vem junto ao soltar o botão é
// cancelado (senão abriria o lightbox ou o link sem querer).
const mouseFino = matchMedia('(hover: hover) and (pointer: fine)');

document.querySelectorAll('[data-arrastar]').forEach((bloco) => {
  const trilho = bloco.querySelector('[data-trilho-arrastar]');
  if (!trilho) return;

  // ---- 3. Progresso: 0 no começo, 1 no fim ----
  const atualizarProgresso = () => {
    const total = trilho.scrollWidth - trilho.clientWidth;
    const visto = total > 0 ? trilho.scrollLeft / total : 1;
    // começa em 15% para a linha nunca sumir de vez
    bloco.style.setProperty('--progresso', (0.15 + visto * 0.85).toFixed(3));
  };
  trilho.addEventListener('scroll', atualizarProgresso, { passive: true });
  atualizarProgresso();

  // ---- 1. Arrastar com o mouse ----
  let segurando = false;
  let arrastou = false;
  let inicioX = 0;
  let inicioScroll = 0;

  trilho.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType !== 'mouse' || evento.button !== 0) return; // dedo: o navegador já rola
    if (evento.target.closest('.legenda')) return; // nomes e chamadas continuam sendo links comuns
    segurando = true;
    arrastou = false;
    inicioX = evento.clientX;
    inicioScroll = trilho.scrollLeft;
    bloco.classList.add('arrastando');
  });

  window.addEventListener('pointermove', (evento) => {
    if (!segurando) return;
    const distancia = evento.clientX - inicioX;
    if (Math.abs(distancia) > 6) arrastou = true; // tremidinha não conta
    trilho.scrollLeft = inicioScroll - distancia;
  });

  window.addEventListener('pointerup', () => {
    if (!segurando) return;
    segurando = false;
    bloco.classList.remove('arrastando');
  });

  // "capture": este ouvinte roda ANTES dos cliques do lightbox e das abas
  trilho.addEventListener(
    'click',
    (evento) => {
      if (!arrastou) return;
      evento.preventDefault();
      evento.stopPropagation();
      arrastou = false;
    },
    true,
  );

  // ---- 2. Círculo "Arraste" que segue o mouse ----
  if (!mouseFino.matches) return;
  trilho.addEventListener('pointermove', (evento) => {
    if (evento.target.closest('.legenda')) {
      bloco.classList.remove('com-cursor');
      return;
    }
    bloco.classList.add('com-cursor');
    const caixa = bloco.getBoundingClientRect();
    bloco.style.setProperty('--x', `${evento.clientX - caixa.left}px`);
    bloco.style.setProperty('--y', `${evento.clientY - caixa.top}px`);
  });
  trilho.addEventListener('pointerenter', () => bloco.classList.add('com-cursor'));
  trilho.addEventListener('pointerleave', () => bloco.classList.remove('com-cursor'));
});
