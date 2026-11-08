// As 22 acomodações, com os dados do site atual (motor de reservas).
// A aba Hospedagem e a prévia do Início saem daqui.
//   slug     -> nome da pasta das fotos em src/assets/fotos-hd/quartos/
//   tipo     -> 'suite' ou 'casa' (usado no filtro)
//   hospedes -> capacidade; null = ainda não sabemos ([A CONFIRMAR])
//   camas    -> texto livre
//   itens    -> comodidades próprias dela (os ícones vêm de ITENS, abaixo).
//               Wi-Fi, ar-condicionado, TV e café da manhã são de todas e
//               aparecem uma vez só, no bloco "o que está incluso".
//   confirmar -> true quando os detalhes ainda precisam ser confirmados
export const ACOMODACOES = [
  { slug: 'suite-africa', nome: 'Suíte África', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['frigobar', 'amenities', 'tematica'] },
  { slug: 'suite-alemanha', nome: 'Suíte Alemanha', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['frigobar', 'lareira'] },
  { slug: 'suite-holanda', nome: 'Suíte Holanda', tipo: 'suite', hospedes: 2, camas: 'Cama queen', itens: ['lareira', 'hidro', 'amenities', 'rebuscada'] },
  { slug: 'suite-espanha', nome: 'Suíte Espanha', tipo: 'suite', hospedes: 4, camas: 'Casal + 2 de solteiro em cômodo separado', itens: ['ar-dois', 'hidro'] },
  { slug: 'suite-franca', nome: 'Suíte França', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['amenities'] },
  { slug: 'suite-dubai', nome: 'Suíte Dubai', tipo: 'suite', hospedes: 2, camas: 'Cama king', itens: ['lareira', 'hidro', 'ducha-externa', 'cuba-dupla', 'cafeteira', 'rebuscada'] },
  { slug: 'suite-inglaterra', nome: 'Suíte Inglaterra', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['tematica'] },
  { slug: 'suite-italia', nome: 'Suíte Itália', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['tematica'] },
  { slug: 'suite-minas-gerais', nome: 'Suíte Minas Gerais', tipo: 'suite', hospedes: 5, camas: 'Queen + casal + solteiro', itens: ['balcao-pia', 'fogao-inducao', 'lareira', 'hidro'] },
  { slug: 'suite-portugal', nome: 'Suíte Portugal', tipo: 'suite', hospedes: 3, camas: 'Queen + solteiro', itens: ['lareira', 'banheira'] },
  { slug: 'suite-santa-catarina', nome: 'Suíte Santa Catarina', tipo: 'suite', hospedes: 3, camas: 'Casal + solteiro', itens: ['hidro'] },
  { slug: 'suite-suica', nome: 'Suíte Suíça', tipo: 'suite', hospedes: 2, camas: 'Cama queen', itens: ['lareira', 'hidro', 'amenities', 'rebuscada'] },
  { slug: 'suite-tailandia', nome: 'Suíte Tailândia', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['tematica'] },
  { slug: 'suite-turquia', nome: 'Suíte Turquia', tipo: 'suite', hospedes: 2, camas: 'Cama de casal', itens: ['tematica'] },
  { slug: 'suite-russia', nome: 'Suíte Rússia', tipo: 'suite', hospedes: 3, camas: 'Casal + solteiro', itens: ['smart-tv', 'hidro'] },
  { slug: 'suite-grecia', nome: 'Suíte Grécia', tipo: 'suite', hospedes: null, camas: null, itens: ['lareira'], confirmar: true },
  { slug: 'suite-marrocos', nome: 'Suíte Marrocos', tipo: 'suite', hospedes: null, camas: null, itens: ['hidro'], confirmar: true },
  { slug: 'casa-bahia', nome: 'Casa Bahia', tipo: 'casa', hospedes: 6, camas: 'Casal + 2 de solteiro com colchões gaveta', itens: ['geladeira', 'fogao'] },
  { slug: 'casa-parana', nome: 'Casa Paraná', tipo: 'casa', hospedes: 5, camas: 'Casal + solteiro + solteiro com gaveta', itens: ['geladeira', 'fogao', 'balcao-pia', 'churrasqueira'] },
  { slug: 'casa-gaucha', nome: 'Casa Gaúcha', tipo: 'casa', hospedes: 4, camas: 'Casal + solteiro com gaveta', itens: ['geladeira', 'fogao', 'churrasqueira'] },
  { slug: 'casa-rio-de-janeiro', nome: 'Casa Rio de Janeiro', tipo: 'casa', hospedes: 3, camas: 'Casal + 2 de solteiro', itens: ['geladeira', 'fogao', 'churrasqueira'] },
  { slug: 'casa-sao-paulo', nome: 'Casa São Paulo', tipo: 'casa', hospedes: 3, camas: 'Casal + 2 de solteiro', itens: ['geladeira', 'fogao', 'churrasqueira'] },
];

// Rótulo e ícone (nome do desenho em src/components/Icone.astro) de cada comodidade
export const ITENS = {
  hidro: { rotulo: 'Hidromassagem', icone: 'hidro' },
  banheira: { rotulo: 'Banheira', icone: 'hidro' },
  lareira: { rotulo: 'Lareira', icone: 'lareira' },
  frigobar: { rotulo: 'Frigobar', icone: 'geladeira' },
  geladeira: { rotulo: 'Geladeira', icone: 'geladeira' },
  fogao: { rotulo: 'Fogão', icone: 'fogao' },
  'fogao-inducao': { rotulo: 'Fogão de indução', icone: 'fogao' },
  'balcao-pia': { rotulo: 'Balcão com pia', icone: 'pia' },
  'cuba-dupla': { rotulo: 'Pia com cuba dupla', icone: 'pia' },
  churrasqueira: { rotulo: 'Churrasqueira externa', icone: 'churrasqueira' },
  amenities: { rotulo: 'Amenities', icone: 'amenities' },
  tematica: { rotulo: 'Decoração temática', icone: 'quadro' },
  rebuscada: { rotulo: 'Decoração rebuscada', icone: 'quadro' },
  'ducha-externa': { rotulo: 'Ducha externa', icone: 'ducha' },
  cafeteira: { rotulo: 'Máquina de café', icone: 'xicara' },
  'smart-tv': { rotulo: 'Smart TV', icone: 'tv' },
  'ar-dois': { rotulo: 'Ar nos dois ambientes', icone: 'ar' },
};

// Os filtros da aba Hospedagem. "teste" recebe uma acomodação e diz se
// ela entra. O mesmo teste é gravado no HTML (data-*) para o JS filtrar.
export const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'suite', rotulo: 'Suítes' },
  { id: 'casa', rotulo: 'Casas' },
  { id: 'hidro', rotulo: 'Com hidromassagem' },
  { id: 'lareira', rotulo: 'Com lareira' },
  { id: 'familia', rotulo: 'Para famílias (4+)' },
];

// Lista de "etiquetas" de cada acomodação, usadas pelos filtros
export function etiquetas(a) {
  const lista = ['todas', a.tipo];
  if (a.itens.includes('hidro')) lista.push('hidro');
  if (a.itens.includes('lareira')) lista.push('lareira');
  if (a.hospedes >= 4) lista.push('familia');
  return lista;
}

// Capacidade desconhecida nunca é apresentada como adequada para um grupo.
// Zero significa que o visitante escolheu ver todas as capacidades.
export function comportaGrupo(capacidade, hospedes) {
  const grupo = Number(hospedes);
  if (grupo === 0) return true;
  return Number.isInteger(grupo) && grupo > 0 && Number.isInteger(capacidade) && capacidade >= grupo;
}
