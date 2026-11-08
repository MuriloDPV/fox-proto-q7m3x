// =========================================================
// ARQUIVO CENTRAL: QUAL FOTO VAI EM QUAL LUGAR DO SITE
// =========================================================
// Quando chegarem as fotos da sessão profissional, o caminho é:
//   1. salvar o arquivo novo em src/assets/fotos/ (as grandes) ou
//      src/assets/fotos-hd/galeria/... (as de coluna);
//   2. cadastrar a foto em src/dados/fotos.js (arquivo + texto alternativo);
//   3. trocar o nome dela AQUI, na seção certa.
// Nenhum componente de aba precisa ser aberto para trocar uma foto.
//
// Tipos de lugar (e o formato ideal de foto para cada um):
//   abertura   -> o topo da aba. Regra da v4.5: NENHUM texto em cima de
//                 foto (a antiga "tela cheia com título gigante por cima"
//                 saiu). Dois tipos, alternados entre abas vizinhas:
//                 - tipo: 'empilhada': título, frase e botão no creme, em
//                   cima; embaixo a foto larga (cinema) com topo em arco.
//                   Só aceita fotos com telaCheia: true (1600 px ou mais).
//                 - tipo: 'dividida' (v4.1): título de um lado, foto do
//                   outro, em tamanho que não estica a foto. Aceita
//                   qualquer foto do catálogo.
//                 Ordem hoje: Início (própria) · Hospedagem empilhada ·
//                   Jardim dividida · Eventos empilhada · Gastronomia
//                   dividida · Lazer empilhada · Visite dividida.
//                 Quando chegar uma foto profissional grande de uma aba
//                   dividida, ela pode virar empilhada: cadastre em
//                   fotos.js, troque "foto" aqui e o tipo. Mais nada muda.
//                 "posicao" escolhe que parte da foto fica visível quando a
//                 foto é cortada (object-position: horizontal vertical).
//                 A foto de abertura também aparece no menu em tela cheia
//                 (no computador), quando o mouse passa no nome da aba.
//   par        -> duas fotos lado a lado, de tamanhos diferentes:
//                 [pequena vertical, grande horizontal].
//   carrossel  -> fileira horizontal que se arrasta; mistura de formatos.
//   (outros)   -> fotos avulsas de um bloco específico, com o nome do bloco.
import { FOTOS } from './fotos.js';

export const SECOES = {
  inicio: {
    panorama: FOTOS.heroPatio,
    convite: FOTOS.porDoSolFlores,
    // Foto do Início no menu em tela cheia (e, até a v4.1, a abertura).
    // Sem "tipo": o Início não usa o HeroAba, e sim AberturaInicio.astro.
    abertura: { foto: FOTOS.heroPatio, posicao: '50% 60%' },
    // Abertura do Início: "três pilares" (proposta C da v4.2, a escolhida).
    // Uma foto para cada coisa que o lugar oferece; fotos ~600 px, por isso
    // em colunas (trava de 1,5× do componente Foto). AberturaInicio.astro.
    pilares: [
      { foto: FOTOS.suiteDubai, posicao: '50% 50%', legenda: 'Estadia', detalhe: '22 suítes e casas temáticas', href: '#hospedagem' },
      { foto: FOTOS.leitores, posicao: '20% 60%', legenda: 'Esculturas', detalhe: 'Mais de 100 esculturas e réplicas', href: '#jardim-de-esculturas' },
      { foto: FOTOS.macarons, posicao: '50% 60%', legenda: 'Eventos', detalhe: 'Casamentos, 15 anos, formaturas', href: '#eventos' },
    ],
    par: [FOTOS.espelhos, FOTOS.patioTarde],
    // as quatro portas de entrada do Início, cada uma leva a uma aba
    experiencias: {
      hospedar: FOTOS.chaleJardim,
      celebrar: FOTOS.macarons,
      passear: FOTOS.tresFiguras,
      comer: FOTOS.cafeFrutas,
    },
    // carrossel de acomodações: a primeira foto de cada uma (pasta do motor)
    acomodacoes: ['suite-dubai', 'suite-espanha', 'casa-parana', 'suite-holanda', 'suite-portugal', 'casa-gaucha', 'suite-africa', 'suite-minas-gerais'],
  },

  hospedagem: {
    abertura: { tipo: 'empilhada', foto: FOTOS.quartoJanelao, posicao: '50% 45%' },
    par: [FOTOS.chaleCasinhas, FOTOS.casaPorDoSol],
  },

  jardim: {
    // dividida: o pôr do sol no lago (tela cheia até a v4) só mostrava as
    // esculturas como silhuetas pequenas, e no celular elas ficavam fora
    // do corte. Não temos foto grande de escultura ainda.
    abertura: { tipo: 'dividida', foto: FOTOS.tresFiguras, posicao: '50% 60%' },
    // parede de esculturas (a única com moldura fina)
    parede: {
      principal: FOTOS.tresFiguras,
      oval: FOTOS.leitores,
      alta: FOTOS.pergoladoJardim,
      aerea: FOTOS.vistaAerea,
      detalhe: FOTOS.florCacto,
    },
    carrossel: [FOTOS.jardimCoberto, FOTOS.aerea1, FOTOS.aguaDia, FOTOS.aerea2],
    visita: FOTOS.jardimSuspenso,
  },

  eventos: {
    abertura: { tipo: 'empilhada', foto: FOTOS.heroPatio, posicao: '50% 55%' },
    par: [FOTOS.macarons, FOTOS.patioMesas],
    carrossel: [FOTOS.patioLanterna, FOTOS.jardimCoberto, FOTOS.pergoladoJardim, FOTOS.aerea2, FOTOS.piscinaNoite, FOTOS.patioTarde],
    // "hospede seus convidados": primeira foto desta acomodação
    hospedar: 'casa-bahia',
  },

  gastronomia: {
    // dividida: a tela cheia era um pôr do sol, que não tem nada a ver com
    // comida. Todas as 6 fotos do café já aparecem na aba; esta repete a
    // do carrossel até chegarem as fotos profissionais.
    abertura: { tipo: 'dividida', foto: FOTOS.cafeMamao, posicao: '50% 50%' },
    par: [FOTOS.cafePaes, FOTOS.cafeFrutas],
    carrossel: [FOTOS.cafeSalao, FOTOS.cafeBolos, FOTOS.cafeMamao, FOTOS.cafeEspelho],
    almoco: FOTOS.patioLanterna,
  },

  lazer: {
    abertura: { tipo: 'empilhada', foto: FOTOS.piscinaCascata, posicao: '50% 60%' },
    par: [FOTOS.piscina2, FOTOS.piscina4],
    carrossel: [FOTOS.piscina1, FOTOS.piscina3, FOTOS.piscina5, FOTOS.piscinaNoite],
    // colagem solta de fotos pequenas (fim de tarde)
    fimDeTarde: [FOTOS.aguaReflexo, FOTOS.patosVaso, FOTOS.campoCapim, FOTOS.aguaPatos],
    recreacao: FOTOS.recreacao,
    jardim: FOTOS.tresFiguras,
  },

  visite: {
    // dividida: "Como chegar" com a chácara vista de cima (antes: pôr do sol)
    abertura: { tipo: 'dividida', foto: FOTOS.vistaAerea, posicao: '50% 50%' },
  },
};
