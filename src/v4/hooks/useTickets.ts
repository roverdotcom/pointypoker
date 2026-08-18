import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

import { isVoteCast } from '@modules/room/utils';
import useStore from '@utils/store';
import { ImportableIssue } from '@v4/types/jira';
import { calculate, CalculationResult } from '@v4/utilities/vote-calculations';
import Estimation from '@v4/types/estimation';
import Issue from '@v4/types/issue';
import Session from '@v4/types/session';
import { Participant } from '@yappy/types/user';

import useData from './useData';
import useJira from './useJira';
import useSession from './useSession';

const SESSIONS_COLLECTION = 'sessions';

type VoteEntry = {
  estimation: Estimation | null;
  hasVoted: boolean;
  participant: Participant;
};

/**
 * Returns the id of the participant who cast the latest vote for the given
 * issue, or null if there are no cast votes. Ties (equal timestamps) break by
 * higher userId so every client resolves the same winner — this is what gates
 * the auto-reveal to a single writer.
 */
const getLastVoterId = (session: Session | null, issueId: string): string | null => {
  const votes = Object.values(session?.estimations ?? {})
    .filter((estimation) => estimation.issueID === issueId && isVoteCast(estimation.value));

  if (!votes.length) return null;

  return votes.reduce((latest, estimation) => {
    const latestMs = latest.timestamp.toMillis();
    const currentMs = estimation.timestamp.toMillis();

    if (currentMs > latestMs) return estimation;
    if (currentMs === latestMs && estimation.userId > latest.userId) return estimation;
    return latest;
  }).userId;
};

const useTickets = () => {
  const storage = useData();
  const { session, sessionName } = useSession();
  const { writePointValue } = useJira();

  const user = useStore((state) => state.preferences.user ?? null);

  const currentIssue: Issue | null = useMemo(() => {
    if (!session?.currentIssue || !session.issues) return null;
    return session.issues[session.currentIssue] ?? null;
  }, [session]);

  const upcomingIssues: Issue[] = useMemo(() => {
    if (!session?.upcoming || !session.issues) return [];
    return session.upcoming.map((id) => session.issues[id]).filter(Boolean);
  }, [session]);

  const historyIssues: Issue[] = useMemo(() => {
    if (!session?.history || !session.issues) return [];
    return session.history.map((id) => session.issues[id]).filter(Boolean);
  }, [session]);

  const nextIssue: Issue | null = useMemo(() => upcomingIssues[0] ?? null, [upcomingIssues]);

  const voteData: VoteEntry[] = useMemo(() => {
    if (!session?.participants) return [];

    const participants = Object.values(session.participants)
      .filter((p) => !p.inactive)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Put self first
    const selfIndex = participants.findIndex((p) => p.id === user?.id);
    if (selfIndex > 0) {
      const [self] = participants.splice(selfIndex, 1);
      participants.unshift(self);
    }

    return participants.map((participant) => {
      const estimation = session.estimations?.[participant.id] ?? null;
      return {
        estimation,
        hasVoted: isVoteCast(estimation?.value),
        participant,
      };
    });
  }, [session, user]);

  const areAllVotesCast = useMemo(() => {
    if (!session?.participants) return false;

    return Object.values(session.participants)
      .filter((p) => !p.inactive && !p.isObserver && p.consecutiveMisses < 3)
      .every((p) => isVoteCast(session.estimations?.[p.id]?.value));
  }, [session]);

  const shouldShowVotes = !!currentIssue?.votingEndedAt;

  const calculation: CalculationResult = useMemo(() => {
    if (!currentIssue?.votingEndedAt) {
      return {
        average: null,
        distribution: {},
        suggestedValue: null,
      };
    }

    const votes: Record<string, string | number> = {};
    if (session?.estimations) {
      Object.values(session.estimations)
        .filter((e) => e.issueID === currentIssue.id)
        .forEach((e) => { votes[e.userId] = e.value; });
    }

    return calculate({ votes });
  }, [session, currentIssue]);

  /**
   * Voting actions
   */

  const castVote = useCallback(async (value: string) => {
    if (!user || !sessionName || !currentIssue) return;

    const estimation: Estimation = {
      id: uuid(),
      issueID: currentIssue.id,
      timestamp: Timestamp.now(),
      userId: user.id,
      value,
    };

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { [`estimations.${user.id}`]: estimation },
    );
  }, [
    user,
    sessionName,
    currentIssue,
    storage,
  ]);

  const clearVote = useCallback(async () => {
    if (!user || !sessionName) return;
    await storage.removeField(
      SESSIONS_COLLECTION,
      sessionName,
      `estimations.${user.id}`,
    );
  }, [
    user,
    sessionName,
    storage,
  ]);

  const revealVotes = useCallback(async () => {
    if (!sessionName || !currentIssue) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { [`issues.${currentIssue.id}.votingEndedAt`]: serverTimestamp() },
    );
  }, [
    sessionName,
    currentIssue,
    storage,
  ]);

  // Auto-reveal once every eligible participant has voted. Only the client that
  // cast the last vote writes the reveal, so exactly one write happens; the ref
  // guards against a repeat write before `votingEndedAt` propagates back.
  const autoRevealedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentIssue || !user || !areAllVotesCast || shouldShowVotes) return;
    if (autoRevealedRef.current === currentIssue.id) return;
    if (getLastVoterId(session, currentIssue.id) !== user.id) return;

    autoRevealedRef.current = currentIssue.id;
    revealVotes();
  }, [
    areAllVotesCast,
    shouldShowVotes,
    currentIssue,
    session,
    user,
    revealVotes,
  ]);

  const setOverrideValue = useCallback(async (issueId: string, value: string | number) => {
    if (!sessionName) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { [`issues.${issueId}.overrideValue`]: value },
    );
  }, [sessionName, storage]);

  /**
   * Issue lifecycle
   */

  const createIssue = useCallback(async (name: string) => {
    if (!user || !sessionName) return;

    const id = uuid();
    const newIssue: Issue = {
      createdAt: Timestamp.now(),
      creatorId: user.id,
      id,
      name,
      votingEndedAt: null,
    };

    const updates: Record<string, unknown> = { [`issues.${id}`]: newIssue };

    if (!session?.currentIssue) {
      updates['currentIssue'] = id;
    }

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      updates,
    );
  }, [
    user,
    sessionName,
    session,
    storage,
  ]);

  const advanceIssue = useCallback(async () => {
    if (!sessionName || !session || !currentIssue) return;

    const calculatedValue = calculation.suggestedValue ?? calculation.average ?? null;
    const updates: Record<string, unknown> = {
      currentIssue: nextIssue?.id ?? null,
      estimations: {},
      history: [...(session.history ?? []), currentIssue.id],
      [`issues.${currentIssue.id}.calculatedValue`]: calculatedValue,
      upcoming: (session.upcoming ?? []).filter((id) => id !== nextIssue?.id),
    };

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      updates,
    );
  }, [
    sessionName,
    session,
    currentIssue,
    nextIssue,
    calculation,
    storage,
  ]);

  const skipIssue = useCallback(async () => {
    if (!sessionName || !currentIssue) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { [`issues.${currentIssue.id}.calculatedValue`]: 'skip' },
    );

    await advanceIssue();
  }, [
    sessionName,
    currentIssue,
    advanceIssue,
    storage,
  ]);

  /**
   * Queue management
   */

  const addToQueue = useCallback(async (issues: Issue[]) => {
    if (!sessionName || !session) return;

    const issueUpdates: Record<string, unknown> = {};
    issues.forEach((issue) => {
      issueUpdates[`issues.${issue.id}`] = issue;
    });

    const newUpcoming = [...(session.upcoming ?? []), ...issues.map((i) => i.id)];

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      {
        ...issueUpdates,
        upcoming: newUpcoming,
      },
    );
  }, [
    sessionName,
    session,
    storage,
  ]);

  const removeFromQueue = useCallback(async (issueId: string) => {
    if (!sessionName || !session) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { upcoming: (session.upcoming ?? []).filter((id) => id !== issueId) },
    );
  }, [
    sessionName,
    session,
    storage,
  ]);

  const reorderQueue = useCallback(async (orderedIds: string[]) => {
    if (!sessionName) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { upcoming: orderedIds },
    );
  }, [sessionName, storage]);

  const setCurrentIssue = useCallback(async (issueId: string) => {
    if (!sessionName) return;

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { currentIssue: issueId },
    );
  }, [sessionName, storage]);

  /**
   * Jira bridge
   */

  const importFromJira = useCallback(async (importable: ImportableIssue[]) => {
    if (!user) return;

    const issues: Issue[] = importable.map((item) => ({
      createdAt: Timestamp.now(),
      creatorId: user.id,
      external: {
        persistedToRemote: false,
        source: 'jira',
        sprint: item.sprint,
        type: item.type,
        url: item.url ?? '',
      },
      id: item.key,
      name: item.summary || item.key,
      votingEndedAt: null,
    }));

    await addToQueue(issues);
  }, [user, addToQueue]);

  const syncToJira = useCallback(async (
    issueId: string,
    value: number,
    fieldId: string,
  ) => {
    if (!sessionName) return;

    const issue = session?.issues[issueId];
    if (!issue?.external) return;

    const ticketKey = issue.external.url.split('/browse/').pop() ?? '';
    await writePointValue(
      ticketKey,
      value,
      fieldId,
    );

    await storage.patch(
      SESSIONS_COLLECTION,
      sessionName,
      { [`issues.${issueId}.external.persistedToRemote`]: true },
    );
  }, [
    sessionName,
    session,
    writePointValue,
    storage,
  ]);

  return {
    addToQueue,
    advanceIssue,
    areAllVotesCast,
    calculation,
    castVote,
    clearVote,
    createIssue,
    currentIssue,
    historyIssues,
    importFromJira,
    nextIssue,
    removeFromQueue,
    reorderQueue,
    revealVotes,
    setCurrentIssue,
    setOverrideValue,
    shouldShowVotes,
    skipIssue,
    syncToJira,
    upcomingIssues,
    voteData,
  };
};

export default useTickets;
