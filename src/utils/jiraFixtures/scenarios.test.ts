import {
  describe,
  expect,
  it,
} from 'vitest';

import { resolveSeed, SCENARIOS } from '@utils/jiraFixtures/scenarios';

describe('resolveSeed', () => {
  it('falls back to the populated scenario for an unknown id', () => {
    expect(resolveSeed('no-such-scenario')).toBe(SCENARIOS.populated.seed);
  });

  it('returns the requested scenario seed', () => {
    expect(resolveSeed('empty-board')).toBe(SCENARIOS['empty-board'].seed);
  });
});
