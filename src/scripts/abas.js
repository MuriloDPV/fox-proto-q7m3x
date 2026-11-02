// ABAS PRINCIPAIS
// Cada aba é uma "tela" (role="tabpanel"). A aba ativa fica no endereço
// (#eventos, #hospedagem...), então:
//   - um link direto para .../#eventos já abre na aba certa;
//   - o botão Voltar do navegador volta para a aba anterior.
// Como funciona o histórico: ao clicar, history.pushState() grava o novo
// #endereço sem recarregar; ao voltar, o navegador dispara "popstate" e a
// gente mostra a aba que está no endereço.
//
// Na v4 as abas moram no menu em tela cheia (Menu.astro). O teclado segue
// o padrão de tablist vertical com "ativação manual": as setas ↑ ↓ (e ← →),
// Home e End só MOVEM o foco (e a foto do menu acompanha); Enter ou Espaço
// abre a aba. Assim dá para olhar as opções sem o menu fechar a cada seta.
import { trocarComTransicao } from './transicao.js';
import { fecharMenu, menuAberto } from './menu.js';

const lista = document.querySelector('[data-abas-principais]');
const palco = document.querySelector('.palco');
const raiz = document.documentElement;

if (lista && palco) {
  const abas = [...lista.querySelectorAll('[role="tab"]')];
  const ids = abas.map((aba) => aba.getAttribute('aria-controls'));
  const paineis = ids.map((id) => document.getElementById(id));
  const tituloBase = document.title;

  const idDoEndereco = () => {
    const pedido = decodeURIComponent(location.hash.slice(1));
    return ids.includes(pedido) ? pedido : ids[0];
  };

  // Marca a aba ativa (ARIA + "roving tabindex": só a ativa entra no Tab)
  const marcarAtiva = (id) => {
    abas.forEach((aba, i) => {
      const ativa = ids[i] === id;
      aba.setAttribute('aria-selected', String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
    });
    paineis.forEach((painel) => {
      painel.hidden = painel.id !== id;
    });
    raiz.dataset.aba = id; // o CSS gerado em Base.astro mostra o painel
    const nome = abas[ids.indexOf(id)].textContent.replace(/^\s*\d+\s*/, '').trim();
    document.title = id === ids[0] ? tituloBase : `${nome} · Chácara Ludwig`;
    // avisa os outros scripts (topo, parallax) que a aba mudou
    document.dispatchEvent(new CustomEvent('aba:trocada', { detail: { id } }));
  };

  // "destino" guarda a aba pedida por último. A troca de verdade acontece um
  // quadro depois (dentro da transição), então comparar com ela evita
  // começar duas transições para a mesma aba (o Voltar dispara popstate
  // e hashchange juntos).
  let destino = idDoEndereco();

  const irPara = (id, { gravarHistorico = true } = {}) => {
    if (!ids.includes(id)) return;
    if (id === destino) {
      fecharMenu(); // clicou na aba que já está aberta: só fecha o menu
      return;
    }
    const veioDoMenu = menuAberto();
    destino = id;
    if (gravarHistorico) history.pushState({ aba: id }, '', `#${id}`);
    trocarComTransicao(palco, () => {
      fecharMenu({ instantaneo: true });
      marcarAtiva(id);
      window.scrollTo(0, 0); // cada aba começa do topo
      // o foco vai para a aba nova (quem usa teclado ou leitor de tela
      // continua de onde a página começa)
      if (veioDoMenu) document.getElementById(id).focus({ preventScroll: true });
    });
  };

  // Estado inicial (sem animação)
  marcarAtiva(destino);

  // Clique numa aba do menu
  lista.addEventListener('click', (evento) => {
    const aba = evento.target.closest('[role="tab"]');
    if (!aba) return;
    evento.preventDefault(); // não deixa o link pular de lugar
    irPara(aba.getAttribute('aria-controls'));
  });

  // Teclado no menu
  lista.addEventListener('keydown', (evento) => {
    const atual = abas.indexOf(document.activeElement);
    if (atual === -1) return;
    if (evento.key === ' ' || evento.key === 'Enter') {
      evento.preventDefault();
      irPara(ids[atual]);
      return;
    }
    const destinos = {
      ArrowDown: (atual + 1) % abas.length,
      ArrowRight: (atual + 1) % abas.length,
      ArrowUp: (atual - 1 + abas.length) % abas.length,
      ArrowLeft: (atual - 1 + abas.length) % abas.length,
      Home: 0,
      End: abas.length - 1,
    };
    if (!(evento.key in destinos)) return;
    evento.preventDefault();
    abas[destinos[evento.key]].focus();
  });

  // Qualquer outro link para uma aba (#visite, #hospedagem...) no
  // conteúdo, no topo ou no rodapé também troca de aba com a transição.
  // Link para um bloco DENTRO da aba (ex.: #orcar): só rola até ele, sem
  // mudar o endereço (senão o # novo faria o site voltar para o Início).
  document.addEventListener('click', (evento) => {
    const link = evento.target.closest('a[href^="#"]');
    if (!link || link.closest('[role="tablist"]')) return;
    const id = link.getAttribute('href').slice(1);
    evento.preventDefault();
    if (ids.includes(id)) {
      irPara(id);
      return;
    }
    const alvo = document.getElementById(id);
    const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    alvo?.scrollIntoView({ behavior: suave, block: 'start' });
  });

  // Botões Voltar/Avançar do navegador (e # digitado na barra de endereço).
  // Um # que não é aba nem existe na página leva ao Início; um # de bloco
  // interno é ignorado.
  const voltarParaEndereco = () => {
    const pedido = decodeURIComponent(location.hash.slice(1));
    if (pedido && !ids.includes(pedido) && document.getElementById(pedido)) return;
    irPara(idDoEndereco(), { gravarHistorico: false });
  };
  window.addEventListener('popstate', voltarParaEndereco);
  window.addEventListener('hashchange', voltarParaEndereco);
}
