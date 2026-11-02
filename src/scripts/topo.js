// TOPO QUE MUDA COM A ROLAGEM (src/components/Topo.astro)
// - Em cima da foto de abertura: transparente, texto claro.
// - Passou da foto: fundo off-white, texto escuro (.topo--solido).
// - Rolando para baixo (depois da foto): o topo sobe e some
//   (.topo--escondido); qualquer rolagem para cima traz de volta.
// requestAnimationFrame junta várias rolagens num cálculo só por quadro.
const topo = document.getElementById('topo');

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
    topo.classList.toggle('topo--solido', y >= limite);
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
