// Abas e links diretos para as acomodações. Mantém o histórico do navegador.
import { trocarComTransicao } from './transicao.js';
import { fecharMenu, menuAberto } from './menu.js';
import { entradaTerminada } from './entrada.js';

const lista = document.querySelector('[data-abas-principais]');
const palco = document.querySelector('.palco');
const raiz = document.documentElement;

if (lista && palco) {
  const abas = [...lista.querySelectorAll('[role="tab"]')];
  const ids = abas.map((aba) => aba.getAttribute('aria-controls'));
  const paineis = ids.map((id) => document.getElementById(id));
  const tituloBase = document.title;
  const lerHash = () => {
    try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
  };
  const acomodacaoDoEndereco = () => {
    const alvo = document.getElementById(lerHash());
    return alvo?.matches('.acomod') ? alvo : null;
  };
  const idDoEndereco = () => {
    const pedido = lerHash();
    return ids.includes(pedido) ? pedido : acomodacaoDoEndereco() ? 'hospedagem' : ids[0];
  };

  const marcarAtiva = (id) => {
    abas.forEach((aba, i) => {
      const ativa = ids[i] === id;
      aba.setAttribute('aria-selected', String(ativa));
      aba.tabIndex = ativa ? 0 : -1;
    });
    paineis.forEach((painel) => { painel.hidden = painel.id !== id; });
    raiz.dataset.aba = id;
    document.querySelectorAll('.topo__atalhos a').forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const nome = abas[ids.indexOf(id)].textContent.replace(/^\s*\d+\s*/, '').trim();
    document.title = id === ids[0] ? tituloBase : `${nome} · Chácara Ludwig`;
    document.dispatchEvent(new CustomEvent('aba:trocada', { detail: { id } }));
  };
  const posicionar = (alvo) => {
    document.querySelectorAll('.acomod--destacada').forEach((c) => c.classList.remove('acomod--destacada'));
    if (!alvo) { window.scrollTo(0, 0); return; }
    document.dispatchEvent(new CustomEvent('acomodacao:abrir', { detail: { alvo } }));
    alvo.classList.add('acomod--destacada');
    alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
    alvo.focus({ preventScroll: true });
  };

  let navegacao = 0;
  const irPara = (id, { gravarHistorico = true, alvo = null } = {}) => {
    if (!ids.includes(id)) return;
    const pedido = ++navegacao;
    const veioDoMenu = menuAberto();
    const hash = `#${alvo ? alvo.id : id}`;
    if (gravarHistorico && location.hash !== hash) history.pushState({ aba: id }, '', hash);
    if (id === raiz.dataset.aba) {
      fecharMenu();
      posicionar(alvo);
      return;
    }
    trocarComTransicao(palco, () => {
      if (pedido !== navegacao) return;
      fecharMenu({ instantaneo: true });
      marcarAtiva(id);
      posicionar(alvo);
      if (veioDoMenu && !alvo) document.getElementById(id).focus({ preventScroll: true });
    });
  };

  marcarAtiva(idDoEndereco());
  const alvoInicial = acomodacaoDoEndereco();
  if (alvoInicial) entradaTerminada.then(() => {
    if (acomodacaoDoEndereco() === alvoInicial) posicionar(alvoInicial);
  });

  lista.addEventListener('click', (evento) => {
    const aba = evento.target.closest('[role="tab"]');
    if (!aba) return;
    evento.preventDefault();
    irPara(aba.getAttribute('aria-controls'));
  });
  lista.addEventListener('keydown', (evento) => {
    const atual = abas.indexOf(document.activeElement);
    if (atual === -1) return;
    if (evento.key === ' ' || evento.key === 'Enter') {
      evento.preventDefault();
      irPara(ids[atual]);
      return;
    }
    const destinos = {
      ArrowDown: (atual + 1) % abas.length, ArrowRight: (atual + 1) % abas.length,
      ArrowUp: (atual - 1 + abas.length) % abas.length, ArrowLeft: (atual - 1 + abas.length) % abas.length,
      Home: 0, End: abas.length - 1,
    };
    if (!(evento.key in destinos)) return;
    evento.preventDefault();
    abas[destinos[evento.key]].focus();
  });
  document.addEventListener('click', (evento) => {
    const link = evento.target.closest('a[href^="#"]');
    if (!link || link.closest('[role="tablist"]') || evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    const id = link.getAttribute('href').slice(1);
    evento.preventDefault();
    if (ids.includes(id)) { irPara(id); return; }
    const alvo = document.getElementById(id);
    if (alvo?.matches('.acomod')) { irPara('hospedagem', { alvo }); return; }
    const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    alvo?.scrollIntoView({ behavior: suave, block: 'start' });
  });
  const voltarParaEndereco = () => {
    const pedido = lerHash();
    const alvo = acomodacaoDoEndereco();
    if (pedido && !ids.includes(pedido) && document.getElementById(pedido) && !alvo) return;
    irPara(idDoEndereco(), { gravarHistorico: false, alvo });
  };
  window.addEventListener('popstate', voltarParaEndereco);
  window.addEventListener('hashchange', voltarParaEndereco);
}
