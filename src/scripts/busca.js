// BUSCA DE DATAS → motor de reservas
// Vale para todo <form data-busca> (aparece na aba A Chácara e em Contato).
// Lê as datas (o input type="date" já entrega AAAA-MM-DD, o formato do
// motor), monta a URL com urlBusca() do config.js e abre em nova aba.
import { urlBusca } from '../config.js';

// Montamos a data na mão porque toISOString() usa o fuso UTC e pode
// devolver o dia errado à noite no Brasil.
const formatar = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const lerData = (texto) => {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

const diaSeguinte = (data) => {
  const d = new Date(data);
  d.setDate(d.getDate() + 1);
  return d;
};

document.querySelectorAll('form[data-busca]').forEach((form) => {
  const checkin = form.querySelector('[name="checkin"]');
  const checkout = form.querySelector('[name="checkout"]');
  const hospedes = form.querySelector('[name="hospedes"]');

  // Começa preenchido (hoje → amanhã) e não deixa escolher datas passadas
  const hoje = new Date();
  checkin.min = formatar(hoje);
  checkin.value = formatar(hoje);
  checkout.min = formatar(diaSeguinte(hoje));
  checkout.value = formatar(diaSeguinte(hoje));

  // Check-out sempre pelo menos 1 dia depois do check-in
  checkin.addEventListener('change', () => {
    if (!checkin.value) return;
    const minimo = diaSeguinte(lerData(checkin.value));
    checkout.min = formatar(minimo);
    if (!checkout.value || lerData(checkout.value) < minimo) {
      checkout.value = formatar(minimo);
    }
  });

  // O navegador já valida "required" e "min" antes de chegar aqui
  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // não recarrega a página
    const url = urlBusca(checkin.value, checkout.value, hospedes.value);
    window.open(url, '_blank', 'noopener');
  });
});
