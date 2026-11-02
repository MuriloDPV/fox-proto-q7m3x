// Configuração central do site. Se algo daqui mudar (domínio do motor de
// reservas, número do WhatsApp, redes sociais), muda só neste arquivo.

// Endereço do motor de reservas que a Chácara já paga. A busca do site novo
// não reserva nada sozinha: ela só monta a URL e abre o motor.
export const MOTOR_RESERVAS_URL = 'https://www.chacaraludwig.com.br';

// Formato que o motor espera: /search/AAAA-MM-DD/AAAA-MM-DD/N
export function urlBusca(checkin, checkout, hospedes) {
  return `${MOTOR_RESERVAS_URL}/search/${checkin}/${checkout}/${hospedes}`;
}

// ---------- Contatos ----------
export const WHATSAPP_NUMERO = '5555981159007'; // principal, reservas
export const WHATSAPP_EXIBICAO = '(55) 98115-9007';
export const TELEFONE_2_NUMERO = '5555999089584';
export const TELEFONE_2_EXIBICAO = '(55) 99908-9584';

export const INSTAGRAM_URL = 'https://www.instagram.com/chacaraludwig';
export const INSTAGRAM_EXIBICAO = '@chacaraludwig';
export const FACEBOOK_URL = 'https://www.facebook.com/ChacaraLudwig';
export const FACEBOOK_EXIBICAO = 'facebook.com/ChacaraLudwig';

// Endereço em partes (o JSON-LD do Google pede assim). A cidade aparece
// no site só aqui, no endereço.
export const ENDERECO = {
  rua: 'ERS-307, km 10, Linha Amadeu',
  cidade: 'Campina das Missões',
  estado: 'RS',
  cep: '98975-000',
};

// ---------- Google Maps (sem chave de API) ----------
// "output=embed" devolve uma página própria para <iframe>. A busca cai na
// ficha "Chácara Ludwig" do Google (conferido: pino ao lado da ERS-307).
const BUSCA_MAPA = 'Chácara Ludwig, ERS-307 km 10, Linha Amadeu';
export const MAPA_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(BUSCA_MAPA)}&z=15&output=embed`;
// "dir" abre o Google Maps já traçando a rota da pessoa até lá
export const MAPA_ROTA = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(BUSCA_MAPA)}`;
// Abre a ficha do lugar, onde ficam as avaliações do Google
export const MAPA_AVALIACOES = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Chácara Ludwig')}`;

// ---------- WhatsApp ----------
// encodeURIComponent troca espaços, acentos e quebras de linha por códigos
// que podem ir dentro de uma URL sem quebrar o link.
export function linkWhatsApp(texto, numero = WHATSAPP_NUMERO) {
  return `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(texto)}`;
}

export const MENSAGEM_RESERVA =
  'Olá! Vim pelo site e gostaria de informações para uma reserva na Chácara Ludwig.';

export const MENSAGEM_EVENTO =
  'Olá! Vim pelo site e gostaria de um orçamento para um evento na Chácara Ludwig.';

export const MENSAGEM_VISITA_GUIADA =
  'Olá! Vim pelo site e gostaria de agendar uma visita guiada ao Jardim de Esculturas para um grupo.\n' +
  'Número de pessoas: \nData pretendida: ';

export const MENSAGEM_VISITA_DIA =
  'Olá! Vim pelo site e gostaria de saber o valor da entrada e os horários para visitar a Chácara Ludwig sem me hospedar.';

export const MENSAGEM_CAVALO =
  'Olá! Vim pelo site e gostaria de agendar um passeio a cavalo na Chácara Ludwig.\n' +
  'Passeio: curto ou longo?\nData pretendida: \nNúmero de pessoas: ';

export const MENSAGEM_ALMOCO =
  'Olá! Vim pelo site e gostaria de informações sobre almoço para um grupo na Chácara Ludwig.\n' +
  'Número de pessoas: \nData pretendida: ';
