// Combina os filtros existentes com a capacidade por acomodação.
import { comportaGrupo } from '../dados/acomodacoes.js';
import { definirHospedes } from './busca.js';
import { linkWhatsApp } from '../config.js';

const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const SUAVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

document.querySelectorAll('[data-filtros]').forEach((barra) => {
  const grade = document.getElementById(barra.dataset.filtros);
  const cartoes = [...grade.querySelectorAll('[data-etiquetas]')];
  const botoes = [...barra.querySelectorAll('[data-filtro]')];
  const contador = document.querySelector(`[data-contador="${grade.id}"]`);
  const capacidade = document.querySelector(`[data-capacidade-filtro="${grade.id}"]`);
  const vazio = document.querySelector(`[data-filtros-vazio="${grade.id}"]`);
  const limpar = document.querySelector(`[data-limpar-filtros="${grade.id}"]`);
  const whatsapp = vazio?.querySelector('[data-filtros-whatsapp]');
  let filtro = 'todas';
  let animacoes = [];

  const aplicar = ({ animar = true } = {}) => {
    animacoes.forEach((a) => a.cancel());
    animacoes = [];
    const grupo = Number(capacidade?.value || 0);
    const antes = new Map(cartoes.filter((c) => !c.hidden).map((c) => [c, c.getBoundingClientRect()]));
    botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)));
    cartoes.forEach((c) => {
      const categoria = c.dataset.etiquetas.split(' ').includes(filtro);
      const comporta = comportaGrupo(c.dataset.capacidade ? Number(c.dataset.capacidade) : null, grupo);
      c.hidden = !categoria || !comporta;
    });
    const ficam = cartoes.filter((c) => !c.hidden);
    const pessoas = grupo ? ` para ${grupo} ${grupo === 1 ? 'hóspede' : 'hóspedes'}` : '';
    contador.textContent = `Mostrando ${ficam.length} de ${cartoes.length} acomodações${pessoas}`;
    if (vazio) vazio.hidden = ficam.length > 0;
    if (whatsapp) whatsapp.href = linkWhatsApp(`Olá! Gostaria de ajuda para acomodar ${grupo ? `um grupo de ${grupo} pessoas` : 'meu grupo'} na Chácara Ludwig.`);
    if (!animar || menosMovimento.matches || !grade.getClientRects().length) return;
    ficam.forEach((c, i) => {
      const depois = c.getBoundingClientRect();
      const antiga = antes.get(c);
      if (antiga) {
        const dx = antiga.left - depois.left;
        const dy = antiga.top - depois.top;
        if (dx || dy) animacoes.push(c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 450, easing: SUAVE }));
      } else {
        animacoes.push(c.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: Math.min(i, 6) * 35, easing: SUAVE, fill: 'backwards' }));
      }
    });
  };

  barra.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-filtro]');
    if (!botao || botao.dataset.filtro === filtro) return;
    filtro = botao.dataset.filtro;
    aplicar();
  });
  capacidade?.addEventListener('change', () => {
    if (Number(capacidade.value) > 0) definirHospedes(capacidade.value);
    else aplicar();
  });
  document.addEventListener('busca:hospedes', (evento) => {
    if (!capacidade) return;
    capacidade.value = String(evento.detail.hospedes);
    aplicar();
  });
  const limparFiltros = () => {
    filtro = 'todas';
    if (capacidade) capacidade.value = '0';
    aplicar({ animar: false });
  };
  limpar?.addEventListener('click', limparFiltros);
  document.addEventListener('acomodacao:abrir', (evento) => {
    // Um link direto deve revelar o quarto mesmo se outro filtro o ocultou.
    if (grade.contains(evento.detail.alvo)) limparFiltros();
  });
  aplicar({ animar: false });
});
