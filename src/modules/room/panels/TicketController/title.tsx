import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import styled, { css } from 'styled-components';
import { parseURL } from 'whatwg-url';

import Spinner from '@assets/icons/loading-circle.svg?react';
import { TextInput } from '@components/common';
import { spinAnimation } from '@components/common/animations';
import { useJira } from '@modules/integrations';
import { QueuedJiraTicket } from '@modules/integrations/jira/types';
import useStore from '@utils/store';
import { ThemedProps } from '@utils/styles/colors/types';
import { PointScheme } from '@yappy/types/estimation';

import { useTickets } from '../../hooks';

type Props = {
  value: string;
  shouldFocus: string | null;
};

const LoadingIcon = styled(Spinner)`
  height: 2rem;
  width: 2rem;
  position: absolute;
  right: 2rem;
  top: 0.625rem;
  animation: ${ spinAnimation } 1s linear infinite;
`;

const Wrapper = styled.div`
  flex: 1;
  padding: 0 1rem;
  position: relative;
  width: 0;
`;

const NotTheTextInput = styled.div <{ hasTitle: boolean }>`
  ${({ hasTitle, theme }: { hasTitle: boolean } & ThemedProps) => css`
    background-color: ${ theme.primary.accent6 };
    border-color: ${ theme.primary.accent6 };
    color: ${ theme.primary[ hasTitle ? 'accent12' : 'accent11'] };
    text-align: start;
    font-size: 1.5rem;

    outline-color: white;
    outline-style: solid;
    outline-width: 0px;
    outline-offset: 0px;
    
    :hover {
      background-color: ${ theme.primary.accent4 };
    }
  `}

  cursor: pointer;
  flex: 1;
  padding: 0.375rem 1rem;
  margin: 0 0 2px 0;
  width: 100%;

  border-width: 2px;
  border-style: solid;
  border-radius: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  transition: all 200ms;
`;

let timeout: ReturnType<typeof setTimeout>;

/**
 * Two components:
 * - A text input that allows users to enter a ticket number or title.
 * - A display component that shows the "name" of the ticket.
 *
 * The text input will only be visible if someone wants to create a new ticket or edit the name of a ticket that is not a JIRA ticket
 */

const Title = ({ shouldFocus, value }: Props) => {
  const {
    handleCreateTicket,
    handleCreatePredefinedTicket,
    shouldShowVotes,
  } = useTickets();
  const [isLoading, setIsLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    defaultBoard,
    setIsFocused,
    preferredPointScheme,
  } = useStore(({ preferences, setTitleInputFocus }) =>
    ({
      defaultBoard: preferences?.jiraPreferences?.defaultBoard,
      preferredPointScheme: preferences?.pointScheme,
      setIsFocused: setTitleInputFocus,
    }) );
  const {
    buildJiraUrl,
    isConfigured: isJiraConfigured,
    getIssueDetail,
    getPointFieldFromBoardId,
  } = useJira();

  const handleCreateNewJiraTicket = useCallback( async (ticketName: string) => {
    try {
      const ticketDetail = await getIssueDetail(ticketName);
      const boardId = ticketDetail.fields.sprint?.originBoardId
        ?? defaultBoard?.id;

      // Resolution is best-effort: the ticket is still created without a point
      // field (estimationFieldId falls back to '' exactly as it does today).
      // Returning early here would silently create no ticket and leave the
      // input spinning, because the ticket is constructed below this call.
      const pointField = boardId
        ? (await getPointFieldFromBoardId(boardId)).field
        : null;
      const newTicket: QueuedJiraTicket = {
        estimationFieldId: pointField?.id ?? '',
        id: ticketDetail.key,
        name: ticketDetail.fields.summary,
        pointOptions: preferredPointScheme as PointScheme,
        ...(ticketDetail.fields.sprint ? { sprint: ticketDetail.fields.sprint } : {}),
        type: ticketDetail.fields.issuetype,
        url: buildJiraUrl(ticketDetail.key),
      };

      handleCreatePredefinedTicket(newTicket);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      handleCreateTicket(ticketName);
    }
  }, [
    defaultBoard,
    getIssueDetail,
    preferredPointScheme,
    getPointFieldFromBoardId,
    buildJiraUrl,
    handleCreatePredefinedTicket,
    handleCreateTicket,
  ]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length === 0) {
      return;
    }

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      setIsLoading(true);
      const newTicketName = e.target.value;
      const ticketIsUrl = !!parseURL(newTicketName);

      // If the new ticket name is a URL, parse it.
      if (ticketIsUrl) {
        const rex = /.*\.atlassian\.net\/browse\/(?<parsedTicket>\w*-\w*)\??/;
        const { parsedTicket = '' } = rex.exec(newTicketName as string)?.groups ?? {};

        // If the URL has a ticket name, create a new Jira ticket
        if (isJiraConfigured && parsedTicket) {
          handleCreateNewJiraTicket(parsedTicket);
          return;
        }
      }

      // Otherwise, create a new ticket based on teh name
      handleCreateTicket(newTicketName);
      setIsLoading(false);
    }, 1000);
  }, [
    handleCreateNewJiraTicket,
    handleCreateTicket,
    isJiraConfigured,
  ]);

  const displayComponent = canEdit ? (
    <>
      {isLoading && <LoadingIcon />}
      <TextInput
        collapse
        inputRef={inputRef}
        id='ticket-title'
        value={value}
        onChange={handleChange}
        placeHolder='ticket number or title'
        onFocus={() => {
          if (shouldShowVotes) {
            inputRef.current?.select();
          }
          setIsFocused(true);
        }}
        onBlur={() => setIsFocused(false)}
      />
    </>
  ) : (
    <>
      <NotTheTextInput
        data-testid='ticket-title-display'
        hasTitle={!!value}
        onClick={() => setCanEdit(true)}
      >
        {value || 'ticket number or title'}
      </NotTheTextInput>
    </>
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanEdit(false);
  }, [value]);

  useEffect(() => {
    if (canEdit) {
      inputRef.current?.select();
    } else {
      setIsFocused(false);
    }
  }, [canEdit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanEdit(!!shouldFocus);
  }, [shouldFocus]);

  return (
    <Wrapper>
      {displayComponent}
    </Wrapper>
  );
};

export default Title;
