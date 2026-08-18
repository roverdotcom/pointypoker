import { Timestamp } from 'firebase/firestore';

import { Participant } from '@yappy/types/user';

import Estimation from './estimation';
import Issue from './issue';

type Session = {
  createdAt: Timestamp;
  currentIssue: string | null;
  estimations: { [userId: string]: Estimation };
  expiresAt: Timestamp;
  history: string[];
  issues: {
    [key: Issue['id']]: Issue;
  };
  name: string;
  participants: {
    [key: Participant['id']]: Participant;
  };
  // Ticket management is handled by ID reference
  upcoming: string[];
  // estimationSchema: EstimationSchema; <- to be defined later
};

export default Session;
