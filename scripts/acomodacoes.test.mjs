import test from 'node:test';
import assert from 'node:assert/strict';
import { ACOMODACOES, comportaGrupo, etiquetas } from '../src/dados/acomodacoes.js';

test('capacidade comporta o grupo, sem exigir que o quarto fique lotado', () => {
  assert.equal(comportaGrupo(4, 4), true);
  assert.equal(comportaGrupo(6, 4), true);
  assert.equal(comportaGrupo(2, 4), false);
  assert.equal(comportaGrupo(2, 1), true);
});
test('capacidade desconhecida só aparece sem filtro por hóspedes', () => {
  assert.equal(comportaGrupo(null, 0), true);
  assert.equal(comportaGrupo(null, 1), false);
  assert.equal(comportaGrupo(undefined, 2), false);
  assert.equal(comportaGrupo(6, -1), false);
  assert.equal(comportaGrupo(6, 2.5), false);
});
test('grupo de quatro combina capacidade com casas e hidromassagem', () => {
  const adequadas = ACOMODACOES.filter((a) => comportaGrupo(a.hospedes, 4));
  assert.deepEqual(adequadas.filter((a) => a.tipo === 'casa').map((a) => a.slug), ['casa-bahia', 'casa-parana', 'casa-gaucha']);
  assert.deepEqual(adequadas.filter((a) => etiquetas(a).includes('hidro')).map((a) => a.slug), ['suite-espanha', 'suite-minas-gerais']);
  assert.equal(ACOMODACOES.some((a) => comportaGrupo(a.hospedes, 8)), false);
});
