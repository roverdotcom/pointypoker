import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BACKLOG_GROUP_ID,
  buildBacklogGroup,
  groupScrumIssues,
} from '@v4/types/issueGroup';

describe('buildBacklogGroup', () => {
  it('labels the group Backlog when the backlog endpoint supplied the issues', () => {
    expect(buildBacklogGroup('backlog')).toEqual({
      id: BACKLOG_GROUP_ID,
      name: 'Backlog',
    });
  });

  it('labels the group Board when falling back to board issues', () => {
    expect(buildBacklogGroup('board')).toEqual({
      id: BACKLOG_GROUP_ID,
      name: 'Board',
    });
  });
});

describe('groupScrumIssues', () => {
  it('buckets issues by their sprint id', () => {
    const issues = [
      { fields: { sprint: { id: 1 } } },
      { fields: { sprint: { id: 2 } } },
      { fields: { sprint: { id: 1 } } },
    ];

    expect(groupScrumIssues(issues)).toEqual([
      {
        groupId: 1,
        issues: [issues[0], issues[2]],
      },
      {
        groupId: 2,
        issues: [issues[1]],
      },
    ]);
  });

  it('drops issues with no sprint rather than inventing a group', () => {
    expect(groupScrumIssues([{ fields: {} }])).toEqual([]);
  });
});
