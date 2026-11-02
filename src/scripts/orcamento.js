// FORMULÁRIO "ORÇAR MEU EVENTO" (aba Eventos)
// Não existe servidor: o formulário só MONTA um texto com os campos e abre
// o WhatsApp com esse texto já escrito (link api.whatsapp.com/send?text=...).
// Enquanto a pessoa digita, a prévia ao lado mostra a mensagem.
import { linkWhatsApp, MENSAGEM_EVENTO } from '../config.js';

// "2027-03-12" (formato do input date) → "12/03/2027"
const dataBrasileira = (texto) => (texto ? texto.split('-').reverse().join('/') : '');

document.querySelectorAll('form[data-orcamento]').forEach((form) => {
  const previa = document.querySelector('[data-previa]');

  const montarMensagem = () => {
    const dados = new FormData(form); // lê todos os campos pelo "name"
    const linhas = [MENSAGEM_EVENTO, ''];
    if (dados.get('nome')) linhas.push(`Nome: ${dados.get('nome')}`);
    linhas.push(`Tipo de evento: ${dados.get('tipo') || 'a definir'}`);
    linhas.push(`Data pretendida: ${dataBrasileira(dados.get('data')) || 'a definir'}`);
    linhas.push(`Número de convidados: ${dados.get('convidados') || 'a definir'}`);
    return linhas.join('\n');
  };

  const atualizarPrevia = () => {
    if (previa) previa.textContent = montarMensagem();
  };

  // "input" dispara a cada tecla; "change" cobre o seletor e a data
  form.addEventListener('input', atualizarPrevia);
  form.addEventListener('change', atualizarPrevia);
  atualizarPrevia();

  // A data mínima é hoje (não dá para orçar evento no passado)
  const data = form.querySelector('[name="data"]');
  const hoje = new Date();
  data.min = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // não recarrega a página nem envia nada
    window.open(linkWhatsApp(montarMensagem()), '_blank', 'noopener');
  });
});
