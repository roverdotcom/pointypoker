/**
 * JQL fragments shared by the legacy and v4 Jira clients.
 */

type FieldRef = {
  id: string;
  name: string;
};

const CUSTOM_FIELD_ID = /^customfield_(\d+)$/;

/**
 * The "this issue has no estimate" clause for a point field.
 *
 * A field's display name cannot be interpolated bare: anything with a space in
 * it — `Story point estimate = EMPTY` — is a JQL syntax error, and the Agile
 * endpoints answer with a 400 rather than an empty page. Names are also not
 * unique across a site, which JQL rejects separately.
 *
 * Custom fields are addressable by their numeric id as `cf[10004]`, which is
 * both unambiguous and space-free, so prefer that. Only a system field (no
 * `customfield_` id) falls back to its name, quoted and escaped.
 */
export const buildUnpointedClause = ({ id, name }: FieldRef): string => {
  const numericId = CUSTOM_FIELD_ID.exec(id)?.[1];

  if (numericId) {
    return `cf[${numericId}] = EMPTY`;
  }

  return `"${name.replace(/[\\"]/g, '\\$&')}" = EMPTY`;
};
