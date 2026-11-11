// NÚMEROS QUE CONTAM (faixa do Início, "+100" do Jardim)
// <span data-contar="13">13</span>: o HTML já traz o número final (quem
// estiver sem JS vê o certo). Quando o número entra na tela, o JS conta de
// data-de (padrão 0) até o valor, desacelerando no fim.
// data-casas="1": conta com uma casa decimal e vírgula (ex.: a nota 4,9).
// requestAnimationFrame chama a função a cada quadro da tela (~60 por s).
const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const numeros = document.querySelectorAll('[data-contar]');
const DURACAO = 1600; // ms

// "desacelera no fim": começa rápido e pousa devagar no valor final
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function contar(el) {
  const fim = Number(el.dataset.contar);
  const inicio = Number(el.dataset.de || 0);
  const casas = Number(el.dataset.casas || 0);
  // toLocaleString('pt-BR'): vírgula decimal (4,9) e sem separador de milhar
  // em números pequenos; com casas = 0 fica igual a antes
  const formatar = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: false });
  const comeco = performance.now();
  const passo = (agora) => {
    const t = Math.min((agora - comeco) / DURACAO, 1);
    el.textContent = formatar(inicio + (fim - inicio) * easeOut(t));
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

if (!menosMovimento.matches && 'IntersectionObserver' in window) {
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        contar(entrada.target);
        observador.unobserve(entrada.target); // conta uma vez só
      });
    },
    { threshold: 0.6 },
  );
  numeros.forEach((el) => {
    // começa do zero, esperando aparecer (com vírgula se tiver casas: "0,0")
    const casas = Number(el.dataset.casas || 0);
    el.textContent = Number(el.dataset.de || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: false });
    observador.observe(el);
  });
}
