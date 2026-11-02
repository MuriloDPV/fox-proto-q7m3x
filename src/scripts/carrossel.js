// CARROSSEL DE FOTOS (cartões da aba Hospedagem)
// Quem faz o carrossel é o CSS: um trilho com rolagem lateral e "ímã"
// (scroll-snap), então o dedo já arrasta no celular. O JS só cuida das
// setas e do contador "3 / 12".
document.querySelectorAll('[data-carrossel]').forEach((carrossel) => {
  const trilho = carrossel.querySelector('[data-trilho]');
  const anterior = carrossel.querySelector('[data-anterior]');
  const proxima = carrossel.querySelector('[data-proxima]');
  const atual = carrossel.querySelector('[data-atual]');
  if (!anterior) return; // acomodação com uma foto só

  const total = trilho.children.length;
  // Índice da foto visível: quanto já rolou ÷ largura de uma foto.
  // Com a aba escondida a largura é 0 (e 0 ÷ 0 dá NaN): aí vale a primeira.
  const indice = () => (trilho.clientWidth ? Math.round(trilho.scrollLeft / trilho.clientWidth) : 0);

  const atualizar = () => {
    const i = indice();
    atual.textContent = String(i + 1);
    anterior.disabled = i === 0;
    proxima.disabled = i === total - 1;
  };

  // scrollBy com behavior "smooth" anima; o CSS de "menos movimento"
  // (scroll-behavior: auto) não vale para scrollBy, então decidimos aqui
  const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  anterior.addEventListener('click', () => trilho.scrollBy({ left: -trilho.clientWidth, behavior: suave }));
  proxima.addEventListener('click', () => trilho.scrollBy({ left: trilho.clientWidth, behavior: suave }));

  // "scrollend" avisa quando a rolagem parou; navegadores antigos só têm "scroll"
  trilho.addEventListener('onscrollend' in window ? 'scrollend' : 'scroll', atualizar, { passive: true });
  atualizar();
});
