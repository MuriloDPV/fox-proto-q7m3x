// LIGHTBOX
// Toda moldura com data-lightbox="nome" vira um botão que amplia a foto.
// Fotos com o mesmo nome formam uma sequência (setas, teclado, swipe).
const dialogo = document.getElementById('lightbox');

if (dialogo) {
  const lugar = dialogo.querySelector('[data-lugar-foto]');
  const foto = new Image();
  foto.className = 'lightbox__foto';
  foto.decoding = 'async';
  lugar.replaceWith(foto);

  const passe = foto.parentElement;
  const legenda = dialogo.querySelector('.lightbox__legenda');
  const contador = dialogo.querySelector('.lightbox__contador');
  const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');

  let sequencia = [];
  let indice = 0;

  const mostrar = (novoIndice, animar = true) => {
    indice = (novoIndice + sequencia.length) % sequencia.length;
    const botao = sequencia[indice];
    foto.src = botao.dataset.grande;
    foto.alt = botao.dataset.alt || '';
    legenda.textContent = botao.dataset.legenda || '';
    contador.textContent = `${indice + 1} / ${sequencia.length}`;
    const varias = sequencia.length > 1;
    dialogo.querySelectorAll('.lightbox__seta').forEach((seta) => (seta.hidden = !varias));

    // troca de foto com a mesma janela que se abre (só dentro da moldura)
    if (animar && !menosMovimento.matches) {
      passe.classList.remove('revelar-local');
      void passe.offsetWidth;
      passe.classList.add('revelar-local');
    }
  };

  // Abrir: clique em qualquer moldura com data-lightbox
  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-lightbox]');
    if (!botao) return;
    sequencia = [...document.querySelectorAll(`[data-lightbox="${botao.dataset.lightbox}"]`)];
    mostrar(sequencia.indexOf(botao), false);
    dialogo.showModal();
  });

  dialogo.querySelector('[data-fechar]').addEventListener('click', () => dialogo.close());
  dialogo.querySelector('[data-anterior]').addEventListener('click', () => mostrar(indice - 1));
  dialogo.querySelector('[data-proxima]').addEventListener('click', () => mostrar(indice + 1));

  // Clique no fundo escuro (fora da foto e dos botões) fecha
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo || evento.target.classList.contains('lightbox__conteudo')) dialogo.close();
  });

  // Teclado: setas trocam a foto (o Esc o <dialog> já trata sozinho)
  dialogo.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') mostrar(indice + 1);
    if (evento.key === 'ArrowLeft') mostrar(indice - 1);
  });

  // Swipe no celular: compara onde o dedo encostou e onde soltou
  let inicioX = null;
  dialogo.addEventListener('pointerdown', (evento) => {
    inicioX = evento.clientX;
  });
  dialogo.addEventListener('pointerup', (evento) => {
    if (inicioX === null) return;
    const distancia = evento.clientX - inicioX;
    inicioX = null;
    if (Math.abs(distancia) < 50 || sequencia.length < 2) return;
    mostrar(distancia < 0 ? indice + 1 : indice - 1);
  });
}
