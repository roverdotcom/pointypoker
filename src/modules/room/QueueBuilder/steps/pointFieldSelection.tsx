import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import styled, { css } from 'styled-components';

import Spinner from '@assets/icons/loading-circle.svg?react';
import { spinAnimation } from '@components/common/animations';
import { useJira } from '@modules/integrations';
import { JiraField, JiraFieldPayload } from '@modules/integrations/jira/types';
import useStore from '@utils/store';
import { ThemedProps } from '@utils/styles/colors/types';

import { InformationWrapper, SectionWrapper } from './common';

type Props = {
  onSelect: (field: JiraField) => void;
};

const LoadingWrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  > svg {
    height: 2rem;
    width: 2rem;
  }
`;

const LoadingIcon = styled(Spinner)`
  ${({ theme }: ThemedProps) => css`
    > polyline, circle {
      stroke: ${theme.greyscale.accent11};
    }
  `}

  animation: ${spinAnimation} 1s linear infinite;
`;

const HelperText = styled.p`
  ${({ theme }: ThemedProps) => css`
    color: ${ theme.greyscale.accent11 };
  `}

  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  text-align: center;
  width: 80%;
`;

const FieldOptionWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 80%;
  overflow: auto;
  border-radius: 0.5rem;
`;

const FieldOption = styled.div`
  ${({ theme }: ThemedProps) => css`
    background-color: ${ theme.greyscale.accent3 };
    color: ${ theme.greyscale.accent12 };
    border-color: ${ theme.greyscale.accent7 };

    &:hover {
      border-color: ${ theme.greyscale.accent12 };
    }
  `}

  cursor: pointer;
  border-width: 1px;
  border-style: solid;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  margin: 0.25rem 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;

  transition:
    background-color 0.25s ease-out,
    color 0.25s ease-out,
    border 0.25s ease-out;
`;

const EmptyStateMessage = styled.p`
  ${({ theme }: ThemedProps) => css`
    color: ${ theme.greyscale.accent11 };
  `}

  font-size: 0.875rem;
  margin: 0.5rem 0;
  text-align: center;
`;

/**
 * Estimates are numeric custom fields. `getIssueFields` returns every field on
 * the site, so narrow it — offering `Summary` as a point field would be worse
 * than offering nothing. `JiraFieldPayload` (not `JiraField`) is the shape with
 * the `schema` metadata needed to filter.
 */
const toNumericCustomFields = (fields: JiraFieldPayload[]): JiraField[] => fields
  .filter((field) => field.id.startsWith('customfield_') && field.schema?.type === 'number')
  .map((field) => ({
    id: field.id,
    name: field.name,
  }));

/**
 * Shown when a board's estimation field cannot be resolved — common on Kanban
 * boards, whose configuration has no estimation block. The chosen field is
 * persisted so the next import for this site skips this step.
 */
const PointFieldSelection = ({ onSelect }: Props) => {
  const [fields, setFields] = useState<JiraField[] | null>(null);
  const { getIssueFields } = useJira();
  const setPointFieldPreference = useStore(({ preferences, setPreference }) => (
    (field: JiraField) => setPreference('jiraPreferences', {
      ...preferences?.jiraPreferences,
      pointField: field,
    })
  ));

  // The legacy Jira hook rebuilds `getIssueFields` on every render, so depending
  // on it here would loop: fetch -> setFields -> render -> new fn -> fetch.
  // Fetch exactly once on mount.
  useEffect(() => {
    getIssueFields()
      .then((result) => setFields(toNumericCustomFields(result as JiraFieldPayload[])))
      .catch((error) => console.error('Error fetching fields:', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback((field: JiraField) => {
    setPointFieldPreference(field);
    onSelect(field);
  }, [onSelect, setPointFieldPreference]);

  return (
    <SectionWrapper>
      <InformationWrapper>
        {fields ? <h2>Select a point field</h2> : (
          <LoadingWrapper><LoadingIcon /></LoadingWrapper>
        )}
      </InformationWrapper>
      {fields && (
        <>
          <HelperText>
            This board has no estimation field configured. Choose the field your team estimates in.
          </HelperText>
          <FieldOptionWrapper>
            {fields.map((field) => (
              <FieldOption
                key={field.id}
                onClick={() => handleSelect(field)}
              >
                {field.name}
              </FieldOption>
            ))}
            {!fields.length && (
              <EmptyStateMessage>No numeric fields found on this site</EmptyStateMessage>
            )}
          </FieldOptionWrapper>
        </>
      )}
    </SectionWrapper>
  );
};

export default PointFieldSelection;
