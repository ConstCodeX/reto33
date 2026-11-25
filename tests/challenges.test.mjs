import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DATABASE_PATH = ':memory:';
const { createChallenge, getChallenge, toggleDay, markNext, deleteChallenge } = await import('../src/lib/challenges.ts');

test('updates only whole days and isolates challenges by owner', () => {
  const id = createChallenge('ana', { habit: 'Leer' });
  assert.equal(toggleDay(id, 'ana', 1.5), null);
  assert.equal(toggleDay(id, 'otra', 1), null);
  assert.deepEqual(markNext(id, 'ana'), [1]);
  assert.deepEqual(toggleDay(id, 'ana', 1), []);
  deleteChallenge(id, 'otra');
  assert.equal(getChallenge(id, 'ana').done, 0);
  deleteChallenge(id, 'ana');
  assert.equal(getChallenge(id, 'ana'), null);
});
