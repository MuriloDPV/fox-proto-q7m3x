import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_ENTRADA } from '../src/dados/entrada.js';

let caso = 0;
async function preparar(t, { reduzido = false, fontesTravadas = false, fontesFalham = false } = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const animacoes = [];
  const quadros = [];
  class No {
    constructor(nome) { this.nome = nome; this.style = {}; this.removido = false; }
    animate(keyframes, options) {
      let concluir;
      const finished = new Promise((resolve) => { concluir = resolve; });
      const animation = { alvo: this.nome, keyframes, options, finished, cancel() { this.cancelada = true; concluir(); } };
      animacoes.push(animation);
      return animation;
    }
    querySelector(seletor) { return no(seletor); }
    querySelectorAll() { return []; }
    getClientRects() { return [{}]; }
    getBoundingClientRect() { return { width: 1280, height: 720 }; }
    getAnimations() { return []; }
    remove() { this.removido = true; }
  }
  const nos = new Map();
  const no = (nome) => {
    if (!nos.has(nome)) nos.set(nome, new No(nome));
    return nos.get(nome);
  };
  const classes = new Set(['entrando', 'entrada-completa']);
  const raiz = { dataset: { aba: 'inicio' }, classList: {
    contains: (c) => classes.has(c), add: (...cs) => cs.forEach((c) => classes.add(c)), remove: (...cs) => cs.forEach((c) => classes.delete(c)),
  } };
  const documento = new EventTarget();
  Object.assign(documento, {
    documentElement: raiz,
    getElementById: (id) => no(`#${id}`),
    querySelector: (s) => no(s), querySelectorAll: () => [],
    fonts: { load() {
      if (fontesFalham) throw new Error('fontes indisponíveis');
      return fontesTravadas ? new Promise(() => {}) : Promise.resolve([]);
    } },
  });
  const preferencia = new EventTarget();
  preferencia.matches = reduzido;
  const janela = new EventTarget();
  const valores = { document: documento, window: janela, Element: No, matchMedia: () => preferencia, requestAnimationFrame: (fn) => quadros.push(fn), sessionStorage: { setItem() {} } };
  const anteriores = new Map(Object.keys(valores).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  Object.entries(valores).forEach(([k, v]) => Object.defineProperty(globalThis, k, { value: v, writable: true, configurable: true }));
  const entrada = await import(`../src/scripts/entrada.js?teste=${++caso}`);
  t.after(async () => {
    janela.dispatchEvent(new Event('pointerdown'));
    await entrada.entradaTerminada;
    anteriores.forEach((descritor, k) => descritor ? Object.defineProperty(globalThis, k, descritor) : delete globalThis[k]);
  });
  return { entrada, raiz, documento, janela, animacoes, no,
    async iniciarSaida(tempo = 500) {
      await new Promise((resolve) => setImmediate(resolve));
      quadros.shift()?.(0);
      quadros.shift()?.(tempo);
      t.mock.timers.tick(0);
    },
  };
}

test('marca central sai antes do arco e nunca atravessa o conteúdo', async (t) => {
  const env = await preparar(t);
  await env.iniciarSaida();
  const centro = env.animacoes.find((a) => a.alvo === '.abertura__centro');
  const arco = env.animacoes.find((a) => a.alvo === '.abertura__papel');
  assert.ok(centro && arco, 'as duas fases foram executadas');
  assert.equal(centro.keyframes.at(-1).opacity, 0);
  assert.ok(arco.options.delay >= centro.options.delay + centro.options.duration);
  assert.ok(centro.keyframes.every((q) => !q.transform));
  assert.ok(env.animacoes.filter((a) => a.alvo.includes('topo-logo')).every((a) => a.keyframes.every((q) => !q.transform)));
  assert.equal(env.animacoes.some((a) => a.alvo === '.abertura__marca'), false);
  env.janela.dispatchEvent(new Event('pointerdown'));
  await env.entrada.entradaTerminada;
  assert.ok(env.animacoes.every((a) => a.cancelada));
  assert.equal(env.no('#abertura').removido, true);
  assert.equal(env.raiz.classList.contains('entrando'), false);
});

test('fontes travadas e animações pendentes não deixam o site bloqueado', async (t) => {
  const env = await preparar(t, { fontesTravadas: true });
  await env.iniciarSaida(1000);
  assert.ok(env.animacoes.length > 0, 'a saída começou, mas as animações ainda não terminaram');
  t.mock.timers.tick(LIMITE_ENTRADA);
  await env.entrada.entradaTerminada;
  assert.equal(env.raiz.classList.contains('aberto'), true);
  assert.equal(env.raiz.classList.contains('entrada-completa'), false);
  assert.equal(env.no('#abertura').removido, true);
});

test('reduzir movimento libera o conteúdo sem criar animações', async (t) => {
  const env = await preparar(t, { reduzido: true });
  await env.entrada.entradaTerminada;
  assert.equal(env.animacoes.length, 0);
  assert.equal(env.raiz.classList.contains('entrando'), false);
});

test('redimensionar encerra a entrada e ela não se repete ao voltar', async (t) => {
  const env = await preparar(t);
  env.janela.dispatchEvent(new Event('resize'));
  await env.entrada.entradaTerminada;
  const quantidade = env.animacoes.length;
  const evento = new Event('aba:trocada');
  evento.detail = { id: 'inicio' };
  env.documento.dispatchEvent(evento);
  assert.equal(env.animacoes.length, quantidade, 'a entrada não se repete ao voltar ao início');
  assert.equal(env.raiz.classList.contains('aberto'), true);
});

test('navegar para outra seção durante a abertura libera a página', async (t) => {
  const env = await preparar(t);
  const evento = new Event('aba:trocada');
  evento.detail = { id: 'hospedagem' };
  env.documento.dispatchEvent(evento);
  await env.entrada.entradaTerminada;
  assert.equal(env.raiz.classList.contains('entrando'), false);
  assert.equal(env.no('#abertura').removido, true);
});

test('falha ao iniciar a animação também libera a página', async (t) => {
  const env = await preparar(t, { fontesFalham: true });
  await env.entrada.entradaTerminada;
  assert.equal(env.raiz.classList.contains('entrando'), false);
  assert.equal(env.no('#abertura').removido, true);
});
