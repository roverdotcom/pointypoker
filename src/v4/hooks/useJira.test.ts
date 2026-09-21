import {
  describe,
  expect,
  it,
} from 'vitest';

import { isKanbanBoard } from '@v4/types/jira';

describe('isKanbanBoard', () => {
  it('treats kanban boards as kanban', () => {
    expect(isKanbanBoard('kanban')).toBe(true);
  });

  it('treats team-managed (simple) boards as kanban', () => {
    expect(isKanbanBoard('simple')).toBe(true);
  });

  it('treats scrum boards as not kanban', () => {
    expect(isKanbanBoard('scrum')).toBe(false);
  });

  it('defaults an unknown or missing type to scrum behaviour', () => {
    expect(isKanbanBoard(undefined)).toBe(false);
  });
});
