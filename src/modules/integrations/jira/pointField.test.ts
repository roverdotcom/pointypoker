import {
  describe,
  expect,
  it,
} from 'vitest';

import { DETECTABLE_POINT_FIELD_NAMES, resolveBoardPointField } from './pointField';

const storyPoints = {
  id: 'customfield_10016',
  name: 'Story Points',
};
const estimate = {
  id: 'customfield_10020',
  name: 'Story point estimate',
};
const summary = {
  id: 'summary',
  name: 'Summary',
};

describe('resolveBoardPointField', () => {
  it('prefers the board configuration estimation field', () => {
    const result = resolveBoardPointField({
      config: { estimation: { field: { fieldId: 'customfield_10016' } } },
      fields: [
        storyPoints,
        estimate,
        summary,
      ],
      preferred: estimate,
    });

    expect(result).toEqual({
      field: storyPoints,
      source: 'config',
    });
  });

  it('falls back to a stored preference when config has no estimation', () => {
    const result = resolveBoardPointField({
      config: {},
      fields: [storyPoints, estimate],
      preferred: estimate,
    });

    expect(result).toEqual({
      field: estimate,
      source: 'preference',
    });
  });

  it('detects a uniquely named story point field when nothing else resolves', () => {
    const result = resolveBoardPointField({
      config: {},
      fields: [storyPoints, summary],
      preferred: null,
    });

    expect(result).toEqual({
      field: storyPoints,
      source: 'detected',
    });
  });

  it('refuses to guess when several detectable names match', () => {
    const result = resolveBoardPointField({
      config: {},
      fields: [storyPoints, estimate],
      preferred: null,
    });

    expect(result).toEqual({
      field: null,
      source: 'unresolved',
    });
  });

  it('ignores a stored preference that is not in the field list', () => {
    const result = resolveBoardPointField({
      config: {},
      fields: [summary],
      preferred: storyPoints,
    });

    expect(result).toEqual({
      field: null,
      source: 'unresolved',
    });
  });

  it('exposes the detectable names it looks for', () => {
    expect(DETECTABLE_POINT_FIELD_NAMES).toContain('story points');
  });
});
