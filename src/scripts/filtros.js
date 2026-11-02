// FILTROS DA HOSPEDAGEM (Todas / Suítes / Casas / Com hidro / Com lareira / Famílias)
// Cada cartão tem data-etiquetas="todas suite hidro ...". Clicar num filtro
// esconde os cartões sem aquela etiqueta e anima os que ficam.
//
// A animação usa a técnica FLIP (First, Last, Invert, Play):
//   First:  mede onde cada cartão está ANTES da troca;
//   Last:   esconde/mostra os cartões e mede onde cada um foi parar;
//   Invert: empurra cada cartão de volta para o lugar antigo (transform);
//   Play:   anima o transform até zero. O cartão "desliza" até o lugar novo.
// Só transform e opacity mudam, então fica liso até no celular.
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const SUAVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

document.querySelectorAll('[data-filtros]').forEach((barra) => {
  const grade = document.getElementById(barra.dataset.filtros);
  const cartoes = [...grade.querySelectorAll('[data-etiquetas]')];
  const botoes = [...barra.querySelectorAll('[data-filtro]')];
  const contador = document.querySelector(`[data-contador="${grade.id}"]`);
  let rodada = 0; // se a pessoa clicar rápido, a troca antiga é abandonada

  const aplicar = async (filtro) => {
    const minhaRodada = ++rodada;
    botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)));
    const entra = (c) => c.dataset.etiquetas.split(' ').includes(filtro);
    const visiveis = cartoes.filter((c) => !c.hidden);
    const saem = visiveis.filter((c) => !entra(c));

    // First
    const antes = new Map(visiveis.map((c) => [c, c.getBoundingClientRect()]));

    // Os que saem somem primeiro (rápido)
    if (!menosMovimento.matches && saem.length) {
      await Promise.all(
        saem.map((c) => c.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], { duration: 200, easing: 'ease-in' }).finished),
      );
      if (minhaRodada !== rodada) return;
    }

    // Troca de verdade
    cartoes.forEach((c) => (c.hidden = !entra(c)));
    const ficam = cartoes.filter((c) => !c.hidden);
    contador.textContent =
      ficam.length === cartoes.length ? `Mostrando as ${cartoes.length} acomodações` : `Mostrando ${ficam.length} de ${cartoes.length} acomodações`;
    if (menosMovimento.matches) return;

    // Last + Invert + Play
    ficam.forEach((c, i) => {
      const depois = c.getBoundingClientRect();
      const antiga = antes.get(c);
      if (antiga) {
        const dx = antiga.left - depois.left;
        const dy = antiga.top - depois.top;
        if (dx || dy) {
          c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 650, easing: SUAVE });
        }
      } else {
        // cartão que estava escondido: aparece subindo, em cascata
        c.animate([{ opacity: 0, transform: 'translateY(24px) scale(0.96)' }, { opacity: 1, transform: 'none' }], {
          duration: 550,
          delay: Math.min(i, 8) * 45,
          easing: SUAVE,
          fill: 'backwards',
        });
      }
    });
  };

  barra.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-filtro]');
    if (botao && botao.getAttribute('aria-pressed') !== 'true') aplicar(botao.dataset.filtro);
  });
});
