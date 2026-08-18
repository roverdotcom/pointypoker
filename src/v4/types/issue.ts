import { Timestamp } from 'firebase/firestore';

import type { ExternalReference } from './external';

type MessageData = {
  authorId: string;
  content: string;
  createdAt: Timestamp;
};

type Issue = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string;
  name: string;
  creatorId: string;
  createdAt: Timestamp;
  votingEndedAt: Timestamp | null;
  calculatedValue?: string | number;
  overrideValue?: string | number;
  messages?: MessageData[];
  external?: ExternalReference;
};

export default Issue;
