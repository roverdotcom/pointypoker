import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

import { serverTimestamp, Timestamp } from 'firebase/firestore';

import generateRoomName from '@utils/room';
import useAuth from '@v4/api/hooks/use-auth';
import useData from '@v4/api/hooks/use-data';
import Session from '@v4/types/session';
import { Participant } from '@yappy/types/user';

const SESSIONS_COLLECTION = 'sessions';

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'not-found'
  | 'error';

export type SessionContextValue = {
  session: Session | null;
  sessionName: string | null;
  status: SessionStatus;
  error: string | null;
  createSession: (name?: string) => Promise<string>;
  joinSession: (name: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  updateParticipant: (participantId: string, data: Partial<Participant>) => Promise<void>;
};

export const Context = createContext<SessionContextValue | null>(null);

type Props = {
  children: ReactNode;
  /** Room id from the URL (`:roomName`). When present, the session auto-loads. */
  roomName?: string;
};

/**
 * Single owner of the live session subscription. Mounted above the Setup/Room
 * swap (in V4Switcher), so the Firestore listener survives that transition —
 * this is what fixes the previous teardown-on-unmount behavior. Session state
 * lives here, not in the global store.
 */
const SessionProvider = ({ children, roomName }: Props): JSX.Element => {
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  // The room we currently have a subscription for; guards the auto-join effect.
  const subscribedNameRef = useRef<string | null>(null);

  const subscribe = useCallback((name: string) => {
    unsubscribeRef.current?.();
    subscribedNameRef.current = name;
    setStatus('loading');
    setError(null);

    unsubscribeRef.current = data.watch<Session>(
      SESSIONS_COLLECTION,
      name,
      (incoming, watchError) => {
        if (watchError) {
          setError(watchError);
          setStatus('error');
        } else if (!incoming) {
          setSession(null);
          setStatus('not-found');
        } else {
          setSession(incoming);
          setStatus('loaded');
        }
      },
    ) ?? null;
  }, [data]);

  const createSession = useCallback(async (name?: string): Promise<string> => {
    if (!user) throw new Error('Must be signed in to create a session');

    const sessionName = name ?? generateRoomName();

    const hostParticipant: Participant = {
      consecutiveMisses: 0,
      id: user.id,
      inactive: false,
      isHost: true,
      isObserver: false,
      joinedAt: Date.now(),
      name: user.name,
    };

    const newSession: Session = {
      createdAt: Timestamp.now(),
      currentIssue: null,
      estimations: {},
      // @ts-expect-error serverTimestamp() returns FieldValue; Firestore replaces it with a Timestamp on write
      expiresAt: serverTimestamp(),
      history: [],
      issues: {},
      name: sessionName,
      participants: { [user.id]: hostParticipant },
      upcoming: [],
    };

    try {
      await data.write(
        SESSIONS_COLLECTION,
        sessionName,
        newSession,
      );
      subscribe(sessionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setStatus('error');
      throw err;
    }

    return sessionName;
  }, [
    user,
    data,
    subscribe,
  ]);

  const joinSession = useCallback(async (name: string): Promise<void> => {
    if (!user) throw new Error('Must be signed in to join a session');

    // Start listening first so a missing doc surfaces as 'not-found' via the watch.
    subscribe(name);

    // Upsert self as a participant without clobbering an existing `isHost`
    // (so a host reloading the page is not demoted).
    try {
      await data.patch(
        SESSIONS_COLLECTION,
        name,
        {
          [`participants.${user.id}.consecutiveMisses`]: 0,
          [`participants.${user.id}.id`]: user.id,
          [`participants.${user.id}.inactive`]: false,
          [`participants.${user.id}.isObserver`]: false,
          [`participants.${user.id}.joinedAt`]: Date.now(),
          [`participants.${user.id}.name`]: user.name,
        },
      );
    } catch (err) {
      // A missing session is already reflected as 'not-found' by the watch.
      setError(err instanceof Error ? err.message : 'Failed to join session');
    }
  }, [
    user,
    data,
    subscribe,
  ]);

  const leaveSession = useCallback(async (): Promise<void> => {
    const leftName = session?.name;
    const leftUserId = user?.id;

    // Stop listening and clear local state, then leave the room URL in the same
    // handler so `roomName` becomes undefined and the auto-join effect does not
    // immediately re-subscribe.
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    subscribedNameRef.current = null;
    setSession(null);
    setStatus('idle');
    navigate('/');

    // Best-effort: mark self inactive in the session we just left.
    if (leftName && leftUserId) {
      await data.patch(
        SESSIONS_COLLECTION,
        leftName,
        { [`participants.${leftUserId}.inactive`]: true },
      );
    }
  }, [
    user,
    session,
    data,
    navigate,
  ]);

  const updateParticipant = useCallback(async (participantId: string,updates: Partial<Participant>): Promise<void> => {
    if (!session) return;

    const patch: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      patch[`participants.${participantId}.${key}`] = value;
    });

    await data.patch(
      SESSIONS_COLLECTION,
      session.name,
      patch,
    );
  }, [session, data]);

  // Auto-load the session named in the URL once the user is authenticated.
  useEffect(() => {
    if (!user || !roomName) return;
    if (subscribedNameRef.current === roomName) return;

    joinSession(roomName).catch(() => { /* surfaced via status/error */ });
  }, [
    user,
    roomName,
    joinSession,
  ]);

  // Drop the live listener when the user signs out (no setState here — the
  // signed-out view is derived below).
  useEffect(() => {
    if (user) return;

    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    subscribedNameRef.current = null;
  }, [user]);

  // Clean up the listener when the provider unmounts (route change away).
  useEffect(() => () => {
    unsubscribeRef.current?.();
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    // A signed-out user has no active session, regardless of any lingering state.
    const activeSession = user ? session : null;

    return {
      createSession,
      error,
      joinSession,
      leaveSession,
      session: activeSession,
      sessionName: activeSession?.name ?? null,
      status: user ? status : 'idle',
      updateParticipant,
    };
  }, [
    user,
    session,
    status,
    error,
    createSession,
    joinSession,
    leaveSession,
    updateParticipant,
  ]);

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};

export default SessionProvider;
