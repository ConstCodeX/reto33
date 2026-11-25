import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isChallengeDay, nextUnmarkedDay } from '../src/lib/challenge-days.ts';

test('accepts only whole days in range and finds the earliest unmarked day', () => {
  assert.equal(isChallengeDay(1.5, 33), false);
  assert.equal(isChallengeDay(NaN, 33), false);
  assert.equal(isChallengeDay(33, 33), true);
  assert.equal(isChallengeDay(34, 33), false);
  assert.equal(nextUnmarkedDay([3, 1], 3), 2);
  assert.equal(nextUnmarkedDay([1, 2, 3], 3), undefined);
});
