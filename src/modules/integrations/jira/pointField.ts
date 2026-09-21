import { JiraField } from './types';

/**
 * Resolution ladder for a board's estimation field.
 *
 * Scrum boards report one in their board configuration. Kanban boards often do
 * not — Atlassian documents `estimation` as a Scrum board setting — so fall
 * back to the user's stored preference, then to a uniquely-named field, and
 * finally give up so the UI can ask.
 */

export const DETECTABLE_POINT_FIELD_NAMES = ['story points', 'story point estimate'];

type BoardConfigLike = {
  estimation?: { field?: { fieldId?: string } };
};

export type PointFieldResolution =
  | {
    field: JiraField;
    source: 'config' | 'detected' | 'preference';
  }
  | {
    field: null;
    source: 'unresolved';
  };

const UNRESOLVED: PointFieldResolution = {
  field: null,
  source: 'unresolved',
};

export const resolveBoardPointField = ({
  config,
  fields,
  preferred,
}: {
  config: BoardConfigLike;
  fields: JiraField[];
  preferred?: JiraField | null;
}): PointFieldResolution => {
  const configFieldId = config.estimation?.field?.fieldId;
  const fromConfig = configFieldId
    ? fields.find((field) => field.id === configFieldId)
    : undefined;

  if (fromConfig) {
    return {
      field: fromConfig,
      source: 'config',
    };
  }

  // A preference is only trusted if the field still exists on this site.
  const fromPreference = preferred
    ? fields.find((field) => field.id === preferred.id)
    : undefined;

  if (fromPreference) {
    return {
      field: fromPreference,
      source: 'preference',
    };
  }

  const detected = fields.filter((field) => DETECTABLE_POINT_FIELD_NAMES.includes(field.name.toLowerCase()));

  // Only accept an unambiguous match — guessing between two point-like fields
  // would silently write estimates to the wrong one.
  if (detected.length === 1) {
    return {
      field: detected[0],
      source: 'detected',
    };
  }

  return UNRESOLVED;
};
