// JANELA "RESERVAR" (src/components/Reservar.astro)
// Todo botão com data-abrir-busca abre a janela de datas. Se ele tiver
// data-acomodacao="Suíte Dubai" e data-hospedes="2", a janela mostra o nome
// e já escolhe 2 hóspedes. Enviar a busca (busca.js abre o motor) fecha a janela.
const dialogo = document.getElementById('reservar');

if (dialogo) {
  const info = dialogo.querySelector('[data-reservar-acomodacao]');
  const hospedes = dialogo.querySelector('[name="hospedes"]');

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-abrir-busca]');
    if (!botao) return;
    evento.preventDefault();

    const { acomodacao, hospedes: capacidade } = botao.dataset;
    info.hidden = !acomodacao;
    info.textContent = acomodacao
      ? `${acomodacao}${capacidade ? ` · até ${capacidade} hóspedes` : ''}`
      : '';
    // o seletor vai de 1 a 8; a capacidade da acomodação vira o padrão
    if (capacidade) {
      hospedes.value = String(Math.min(Number(hospedes.value) || 2, Number(capacidade), 8));
      hospedes.dispatchEvent(new Event('change', { bubbles: true }));
    }

    dialogo.showModal();
  });

  // Fechar: botão ×, clique fora da caixa (no fundo) ou depois de buscar
  dialogo.querySelector('[data-fechar]').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });
  dialogo.querySelector('form').addEventListener('submit', () => {
    setTimeout(() => dialogo.close(), 0); // deixa o busca.js abrir o motor primeiro
  });
}
