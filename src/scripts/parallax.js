// PARALLAX SUAVE
// Movimento leve que dá sensação de profundidade. Com "menos movimento"
// ligado, nada acontece.
//
// Dois casos:
//   1. .heroi-aba (foto de tela cheia, no topo da aba): enquanto a pessoa
//      rola, a foto anda 30% da rolagem, mais devagar que a página
//      (HeroAba.astro). O JS só escreve um número na variável CSS
//      --desloca; quem move a foto é o transform do CSS.
//   2. Os três pilares da abertura do Início (v4.3), o "detalhe vivo"
//      depois da entrada do site:
//      - com mouse: as fotos flutuam um pouco para o lado oposto ao do
//        mouse, cada uma numa profundidade (a do fim da escada anda mais);
//      - sem mouse (celular): na rolagem, cada foto sobe num ritmo
//        diferente e a escada "se ajeita".
//      Só começa depois da entrada (entradaTerminada, de entrada.js), para
//      não mexer nas fotos enquanto elas entram.
import { entradaTerminada } from './entrada.js';

const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const VELOCIDADE = 0.3;

// pilares do Início
const MOUSE_PX = 11; // quanto as fotos andam com o mouse, no máximo (px)
const PROFUNDIDADE = [0.55, 0.85, 1.2]; // multiplica MOUSE_PX, foto por foto
const INERCIA = 0.07; // 0 a 1: menor = segue o mouse mais devagar (mais macio)
const ROLAGEM = [0.02, 0.045, 0.07]; // celular: fração da rolagem que cada foto sobe a mais

if (!menosMovimento.matches) {
  // ---------- 1. Foto de tela cheia ----------
  let heroi = null;
  let altura = 0;
  let agendado = false;

  const escolher = () => {
    heroi = document.querySelector('.painel:not([hidden]) .heroi-aba');
    altura = heroi ? heroi.offsetHeight : 0;
  };

  const mover = () => {
    agendado = false;
    if (!heroi) return;
    const y = Math.min(window.scrollY, altura); // depois da foto, não precisa mexer
    heroi.style.setProperty('--desloca', `${(y * VELOCIDADE).toFixed(1)}px`);
  };

  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(mover);
  };

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', () => {
    escolher();
    agendar();
  });
  document.addEventListener('aba:trocada', () => {
    escolher();
    mover();
  });

  escolher();
  mover();

  // ---------- 2. Pilares do Início ----------
  entradaTerminada.then(() => {
    const pilares = [...document.querySelectorAll('[data-entrada="pilar"]')];
    const abertura = document.querySelector('[data-entrada="inicio"]');
    if (!pilares.length || !abertura) return;

    // Move cada pilar (só transform: o layout em volta não muda)
    const posicionar = (x, y) =>
      pilares.forEach((pilar, i) => {
        pilar.style.transform = `translate3d(${(x * PROFUNDIDADE[i]).toFixed(2)}px, ${(y * PROFUNDIDADE[i]).toFixed(2)}px, 0)`;
      });

    // O Início está aberto e a abertura dele aparece na tela?
    const naTela = () => abertura.getClientRects().length > 0 && abertura.getBoundingClientRect().bottom > 0;

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      // COM MOUSE. "alvo" = para onde o mouse manda (-1 a 1 em cada eixo);
      // "atual" chega perto do alvo um pouco a cada quadro (INERCIA): o
      // movimento fica macio, com um leve atraso, em vez de colado no mouse.
      const alvo = { x: 0, y: 0 };
      const atual = { x: 0, y: 0 };
      let rodando = false;

      const quadro = () => {
        atual.x += (alvo.x - atual.x) * INERCIA;
        atual.y += (alvo.y - atual.y) * INERCIA;
        posicionar(-atual.x * MOUSE_PX, -atual.y * MOUSE_PX);
        // parou de mexer: desliga o laço até o próximo movimento
        if (Math.abs(alvo.x - atual.x) + Math.abs(alvo.y - atual.y) > 0.002) requestAnimationFrame(quadro);
        else rodando = false;
      };
      const ligar = () => {
        if (rodando) return;
        rodando = true;
        requestAnimationFrame(quadro);
      };

      window.addEventListener(
        'pointermove',
        (evento) => {
          if (evento.pointerType !== 'mouse' || !naTela()) return;
          alvo.x = (evento.clientX / innerWidth) * 2 - 1;
          alvo.y = (evento.clientY / innerHeight) * 2 - 1;
          ligar();
        },
        { passive: true },
      );
      // o mouse saiu da janela: as fotos voltam devagar para o lugar
      document.documentElement.addEventListener('mouseleave', () => {
        alvo.x = 0;
        alvo.y = 0;
        ligar();
      });
    } else {
      // SEM MOUSE (celular): segue a rolagem
      let agendadoPilares = false;
      const rolar = () => {
        agendadoPilares = false;
        if (!naTela()) return;
        const y = Math.min(window.scrollY, abertura.offsetHeight);
        pilares.forEach((pilar, i) => {
          pilar.style.transform = `translate3d(0, ${(-y * ROLAGEM[i]).toFixed(1)}px, 0)`;
        });
      };
      window.addEventListener(
        'scroll',
        () => {
          if (agendadoPilares) return;
          agendadoPilares = true;
          requestAnimationFrame(rolar);
        },
        { passive: true },
      );
    }
  });
}
