import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildUnpointedClause } from './jql';

describe('buildUnpointedClause', () => {
  it('addresses a custom field by its numeric id', () => {
    expect(buildUnpointedClause({
      id: 'customfield_10004',
      name: 'Points',
    })).toBe('cf[10004] = EMPTY');
  });

  it('addresses a multi-word custom field by id, never by bare name', () => {
    // `Story point estimate = EMPTY` is a JQL syntax error: the parser expects
    // an operator after `Story`. This is the clause that returned zero issues
    // on every Kanban import.
    expect(buildUnpointedClause({
      id: 'customfield_11945',
      name: 'Story point estimate',
    })).toBe('cf[11945] = EMPTY');
  });

  it('quotes the name of a system field, which has no numeric id', () => {
    expect(buildUnpointedClause({
      id: 'timeoriginalestimate',
      name: 'Original estimate',
    })).toBe('"Original estimate" = EMPTY');
  });

  it('escapes quotes and backslashes in a quoted field name', () => {
    expect(buildUnpointedClause({
      id: 'weird',
      name: 'He said "hi" \\ there',
    })).toBe('"He said \\"hi\\" \\\\ there" = EMPTY');
  });
});
