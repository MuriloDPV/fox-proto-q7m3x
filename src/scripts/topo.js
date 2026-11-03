// TOPO QUE MUDA COM A ROLAGEM (src/components/Topo.astro)
// - Começo da página: topo grande. Em cima da foto de abertura fica
//   transparente, com texto claro.
// - Rolou um pouco (COMPACTA px): topo compacto (.topo--compacto), com
//   fundo creme meio transparente e texto escuro (.topo--solido).
// - Abas sem foto no alto (o Início): já começa com texto escuro.
// - Rolando para baixo (depois da foto): o topo sobe e some
//   (.topo--escondido); qualquer rolagem para cima traz de volta.
// requestAnimationFrame junta várias rolagens num cálculo só por quadro.
const topo = document.getElementById('topo');

// a partir de quantos px rolados o topo fica compacto
const COMPACTA = 40;

if (topo) {
  let limite = 0; // onde a foto de abertura da aba atual termina
  let ultimoY = window.scrollY;
  let agendado = false;

  const medir = () => {
    const heroi = document.querySelector('.painel:not([hidden]) .heroi-aba');
    limite = heroi ? heroi.offsetHeight - topo.offsetHeight : 0;
  };

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    const descendo = y > ultimoY + 2;
    const subindo = y < ultimoY - 2;
    const compacto = y > COMPACTA;
    topo.classList.toggle('topo--compacto', compacto);
    // fundo creme + texto escuro: no topo compacto ou fora da foto
    topo.classList.toggle('topo--solido', compacto || y >= limite);
    if (descendo && y > limite + 160) topo.classList.add('topo--escondido');
    if (subindo || y <= limite) topo.classList.remove('topo--escondido');
    ultimoY = y;
  };

  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(atualizar);
  };

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', () => {
    medir();
    agendar();
  });

  // Trocou de aba: a página volta ao topo e a foto nova pode ter outra altura
  document.addEventListener('aba:trocada', () => {
    medir();
    ultimoY = window.scrollY;
    topo.classList.remove('topo--escondido');
    atualizar();
  });

  // Teclado: se algo dentro do topo recebe foco, ele aparece
  topo.addEventListener('focusin', () => topo.classList.remove('topo--escondido'));

  medir();
  atualizar();
}
