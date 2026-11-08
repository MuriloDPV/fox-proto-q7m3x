// Todas as buscas compartilham as datas e o número de hóspedes nesta página.
// Nenhuma reserva é enviada: o formulário só abre a consulta no motor existente.
import { urlBusca } from '../config.js';

const formatar = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
const seguinte = (texto) => {
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + 1);
  return formatar(data);
};
const hoje = formatar(new Date());
const estado = { checkin: hoje, checkout: seguinte(hoje), hospedes: '2' };
const buscas = [...document.querySelectorAll('form[data-busca]')].map((form) => ({
  form,
  checkin: form.querySelector('[name="checkin"]'),
  checkout: form.querySelector('[name="checkout"]'),
  hospedes: form.querySelector('[name="hospedes"]'),
}));

const atualizar = () => buscas.forEach(({ checkin, checkout, hospedes }) => {
  checkin.min = hoje;
  checkin.value = estado.checkin;
  checkout.min = seguinte(estado.checkin);
  checkout.value = estado.checkout;
  hospedes.value = estado.hospedes;
});
atualizar();

buscas.forEach(({ form, checkin, checkout, hospedes }) => {
  checkin.addEventListener('change', () => {
    if (!checkin.value || !checkin.validity.valid) return;
    estado.checkin = checkin.value;
    const minimo = seguinte(estado.checkin);
    if (estado.checkout < minimo) estado.checkout = minimo;
    atualizar();
  });
  checkout.addEventListener('change', () => {
    if (!checkout.value || !checkout.validity.valid) return;
    estado.checkout = checkout.value;
    atualizar();
  });
  hospedes.addEventListener('change', () => {
    estado.hospedes = hospedes.value;
    atualizar();
  });
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!form.reportValidity()) return;
    window.open(urlBusca(checkin.value, checkout.value, hospedes.value), '_blank', 'noopener');
  });
});
