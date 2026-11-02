// MENU EM TELA CHEIA (src/components/Menu.astro)
// - O botão "Menu" do topo abre e fecha (aria-expanded diz o estado).
// - Aberto: a página por baixo fica "inert" (não recebe clique nem foco do
//   Tab), então o teclado fica preso entre o topo e o menu. Esc fecha.
// - A foto da esquerda troca conforme o mouse passa (ou o foco do teclado
//   chega) em cada nome de aba.
// - A troca de aba em si fica em abas.js, que chama fecharMenu().
const menu = document.getElementById('menu');
const botao = document.querySelector('[data-abrir-menu]');
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
let aberto = false;

// Tudo que fica "por baixo" do menu
const foraDoMenu = () => document.querySelectorAll('.palco, .rodape, .whats');

// Mostra a foto da aba "id" e esconde as outras
function mostrarFoto(id) {
  menu?.querySelectorAll('[data-menu-foto]').forEach((foto) => {
    foto.classList.toggle('ativa', foto.dataset.menuFoto === id);
  });
}

export function abrirMenu() {
  if (!menu || aberto) return;
  aberto = true;
  menu.hidden = false;
  void menu.offsetWidth; // força o navegador a desenhar o estado "fechado" antes (senão não anima)
  menu.classList.add('menu--aberto');
  document.body.classList.add('menu-aberto');
  botao.setAttribute('aria-expanded', 'true');
  foraDoMenu().forEach((el) => (el.inert = true));

  // começa mostrando a foto da aba atual e com o foco nela
  const ativa = menu.querySelector('[role="tab"][aria-selected="true"]');
  if (ativa) {
    mostrarFoto(ativa.dataset.foto);
    ativa.focus({ preventScroll: true });
  }
}

// instantaneo: true quando a troca de aba já tem a própria animação
// (o menu some dentro da View Transition, sem animar duas vezes)
export function fecharMenu({ instantaneo = false } = {}) {
  if (!menu || !aberto) return;
  aberto = false;
  menu.classList.remove('menu--aberto');
  document.body.classList.remove('menu-aberto');
  botao.setAttribute('aria-expanded', 'false');
  foraDoMenu().forEach((el) => (el.inert = false));

  const esconder = () => {
    if (!aberto) menu.hidden = true;
  };
  if (instantaneo || menosMovimento.matches) {
    esconder();
  } else {
    // espera o recorte (clip-path) terminar para tirar o menu da tela
    const aoTerminar = (evento) => {
      if (evento.target !== menu) return; // transições dos filhos também avisam aqui
      menu.removeEventListener('transitionend', aoTerminar);
      esconder();
    };
    menu.addEventListener('transitionend', aoTerminar);
    setTimeout(esconder, 1000); // garantia, caso o evento não chegue
    botao.focus({ preventScroll: true }); // o foco volta para o botão Menu
  }
}

export const menuAberto = () => aberto;

if (menu && botao) {
  botao.addEventListener('click', () => (aberto ? fecharMenu() : abrirMenu()));

  // Esc fecha (se não houver uma janela, como a de reservar, por cima)
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && aberto && !document.querySelector('dialog[open]')) fecharMenu();
  });

  // Foto que acompanha o mouse e o foco do teclado
  const trocarFoto = (evento) => {
    const item = evento.target.closest('[data-foto]');
    if (item) mostrarFoto(item.dataset.foto);
  };
  menu.addEventListener('pointerover', trocarFoto);
  menu.addEventListener('focusin', trocarFoto);
}
