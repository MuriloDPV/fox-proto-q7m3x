// O QUE APARECE AO ROLAR
// Três tipos de elemento ganham a classe .visivel quando entram na tela, e
// o CSS (global.css, "ANIMAÇÕES DE ENTRADA") faz o resto:
//   [data-linhas]  -> títulos que sobem linha por linha (máscara)
//   [data-revelar] -> fotos que abrem de baixo para cima com leve escala
//   [data-surgir]  -> blocos de texto que sobem e aparecem
// IntersectionObserver avisa quando um elemento aparece, sem precisar ficar
// medindo a rolagem. Elementos de abas escondidas (display: none) não
// "aparecem"; quando a aba abre, o observador percebe sozinho.
const alvos = document.querySelectorAll('[data-linhas], [data-revelar], [data-surgir]');

if ('IntersectionObserver' in window) {
  // A caixa da foto começa totalmente recortada por clip-path. Observar
  // o contêiner sem recorte evita que ela continue oculta ao pular a rolagem.
  const grupos = new Map();
  alvos.forEach((el) => {
    const observado = el.hasAttribute('data-revelar') ? el.parentElement : el;
    if (!grupos.has(observado)) grupos.set(observado, []);
    grupos.get(observado).push(el);
  });
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        grupos.get(entrada.target)?.forEach((el) => el.classList.add('visivel'));
        observador.unobserve(entrada.target); // anima uma vez só
      });
    },
    // rootMargin: a "linha de chegada" fica 8% acima da borda de baixo da
    // tela, para a animação começar quando o elemento já está à vista
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  grupos.forEach((_, el) => observador.observe(el));
} else {
  alvos.forEach((el) => el.classList.add('visivel'));
}
