// TOPO QUE MUDA COM A ROLAGEM (src/components/Topo.astro)
// - Começo da página: topo grande.
// - Rolou um pouco (COMPACTA px): topo compacto (.topo--compacto), com
//   fundo creme meio transparente.
// - Texto escuro (.topo--solido) SEMPRE: desde a v4.5 nenhuma aba abre com
//   foto atrás do topo (antes, nas aberturas em tela cheia, o topo ficava
//   transparente com texto claro em cima da foto).
// - Rolando para baixo: o topo sobe e some
//   (.topo--escondido); qualquer rolagem para cima traz de volta.
// requestAnimationFrame junta várias rolagens num cálculo só por quadro.
const topo = document.getElementById('topo');

// a partir de quantos px rolados o topo fica compacto
const COMPACTA = 40;

if (topo) {
  // a partir de quantos px rolados o topo pode se esconder ao descer
  const ESCONDE = 160;
  let ultimoY = window.scrollY;
  let agendado = false;

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    const descendo = y > ultimoY + 2;
    const subindo = y < ultimoY - 2;
    const compacto = y > COMPACTA;
    topo.classList.toggle('topo--compacto', compacto);
    if (descendo && y > ESCONDE) topo.classList.add('topo--escondido');
    if (subindo || y <= 0) topo.classList.remove('topo--escondido');
    ultimoY = y;
  };

  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(atualizar);
  };

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);

  // Trocou de aba: a página volta ao topo
  document.addEventListener('aba:trocada', () => {
    ultimoY = window.scrollY;
    topo.classList.remove('topo--escondido');
    atualizar();
  });

  // Teclado: se algo dentro do topo recebe foco, ele aparece
  topo.addEventListener('focusin', () => topo.classList.remove('topo--escondido'));

  topo.classList.add('topo--solido');
  atualizar();
}
