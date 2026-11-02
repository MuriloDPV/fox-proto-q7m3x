// Ponto de entrada dos scripts. Cada arquivo cuida de uma coisa e procura
// no HTML só o que é dele. A ordem importa em dois pontos:
//   - menu.js antes de abas.js (abas.js usa fecharMenu);
//   - busca.js antes de reservar.js (a janela fecha depois que a busca
//     abriu o motor).
import './entrada.js'; // tela de abertura e chegada do Início (v4.3)
import './menu.js';
import './abas.js';
import './topo.js';
import './parallax.js';
import './revelar.js';
import './lightbox.js';
import './busca.js';
import './reservar.js';
import './depoimentos.js';
import './numeros.js';
import './carrossel.js';
import './arrastar.js';
import './filtros.js';
import './orcamento.js';
import './faq.js';
