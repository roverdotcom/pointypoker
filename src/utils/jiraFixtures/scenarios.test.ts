import {
  describe,
  expect,
  it,
} from 'vitest';

import { getJiraJsFixtures, getLegacyFixtures } from '@utils/jiraFixtures';
import { resolveSeed, SCENARIOS } from '@utils/jiraFixtures/scenarios';

describe('resolveSeed', () => {
  it('falls back to the populated scenario for an unknown id', () => {
    expect(resolveSeed('no-such-scenario')).toBe(SCENARIOS.populated.seed);
  });

  it('returns the requested scenario seed', () => {
    expect(resolveSeed('empty-board')).toBe(SCENARIOS['empty-board'].seed);
  });
});

describe('kanban fixture scenarios', () => {
  it('exposes a kanban board with no sprints', async () => {
    const boards = await getJiraJsFixtures('kanban-backlog').getBoards();
    expect(boards.values?.[0]?.type).toBe('kanban');

    const sprints = await getJiraJsFixtures('kanban-backlog').getSprintsForBoard(4);
    expect(sprints.values).toHaveLength(0);
  });

  it('gives backlog issues no sprint at all', async () => {
    const result = await getJiraJsFixtures('kanban-backlog').getIssuesForBoard(4);
    expect(result.issues?.length).toBeGreaterThan(0);
    result.issues?.forEach((issue) => {
      expect((issue.fields as { sprint?: unknown }).sprint).toBeUndefined();
    });
  });

  it('reports board type through board configuration', async () => {
    const config = await getJiraJsFixtures('kanban-backlog').getBoardConfiguration(4);
    expect(config.type).toBe('kanban');
  });

  it('omits the estimation block for the no-estimation scenario', async () => {
    const config = await getLegacyFixtures('kanban-no-estimation').getBoardConfiguration(4);
    expect(config.estimation).toBeUndefined();
  });

  it('honours startAt when paging issues', async () => {
    // `huge-backlog` has 120 issues against a page size of 100, so page two is
    // genuinely non-empty. A 40-issue fixture would make this test vacuous.
    // Uses getIssuesForBoard, not getBacklogForBoard — the latter arrives in
    // Task 4, and this task must go green on its own.
    const fixtures = getJiraJsFixtures('huge-backlog');
    const firstPage = await fixtures.getIssuesForBoard(
      4,
      null,
      0,
    );
    const secondPage = await fixtures.getIssuesForBoard(
      4,
      null,
      100,
    );

    expect(firstPage.total).toBe(120);
    expect(firstPage.issues).toHaveLength(100);
    expect(secondPage.issues).toHaveLength(20);
    expect(secondPage.issues?.[0]?.key).not.toBe(firstPage.issues?.[0]?.key);
  });
});
