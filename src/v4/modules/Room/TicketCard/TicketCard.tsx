import { AnimatePresence } from 'motion/react';
import { div as MotionDiv } from 'motion/react-client';

import useTickets from '@v4/api/hooks/use-tickets';

import CardActions from './CardActions';
import CardHeader from './CardHeader';
import CardShell from './CardShell';
import ResultsDisplay from './ResultsDisplay';
import VoteStatus from './VoteStatus';
import VotingControls from './VotingControls';

const cardAnimation = {
  animate: {
    filter: 'blur(0rem)',
    opacity: 1,
    transform: 'perspective(600px) rotateY(0deg) translateX(0px) scale(1)',
  },
  exit: {
    filter: 'blur(0.75rem)',
    opacity: 0,
    transform: 'perspective(600px) rotateY(-8deg) translateX(-120px) scale(0.95)',
  },
  initial: {
    filter: 'blur(0.75rem)',
    opacity: 0,
    transform: 'perspective(600px) rotateY(8deg) translateX(120px) scale(0.95)',
  },
};

const innerSwap = {
  animate: {
    filter: 'blur(0rem)',
    opacity: 1,
    scale: 1,
  },
  exit: {
    filter: 'blur(0.5rem)',
    opacity: 0,
    scale: 0.95,
  },
  initial: {
    filter: 'blur(0.5rem)',
    opacity: 0,
    scale: 0.95,
  },
};

const TicketCard = () => {
  const {
    areAllVotesCast,
    calculation,
    castVote,
    clearVote,
    currentIssue,
    advanceIssue,
    revealVotes,
    shouldShowVotes,
    skipIssue,
    voteData,
  } = useTickets();

  if (!currentIssue) return null;

  return (
    <MotionDiv
      animate={cardAnimation.animate}
      exit={cardAnimation.exit}
      initial={cardAnimation.initial}
      transition={{
        duration: 0.35,
        ease: [
          0.4,
          0,
          0.2,
          1,
        ],
      }}
    >
      <CardShell>
        <CardHeader issue={currentIssue} />

        <AnimatePresence mode="wait">
          {shouldShowVotes ? (
            <MotionDiv
              key="results"
              animate={innerSwap.animate}
              exit={innerSwap.exit}
              initial={innerSwap.initial}
              style={{ flex: 1 }}
              transition={{ duration: 0.25 }}
            >
              <ResultsDisplay calculation={calculation} />
            </MotionDiv>
          ) : (
            <MotionDiv
              key="voting"
              animate={innerSwap.animate}
              exit={innerSwap.exit}
              initial={innerSwap.initial}
              style={{ flex: 1 }}
              transition={{ duration: 0.25 }}
            >
              <VotingControls
                onClear={clearVote}
                onVote={castVote}
              />
            </MotionDiv>
          )}
        </AnimatePresence>

        <VoteStatus
          shouldShowVotes={shouldShowVotes}
          voteData={voteData}
        />

        <CardActions
          areAllVotesCast={areAllVotesCast}
          onAdvance={advanceIssue}
          onReveal={revealVotes}
          onSkip={skipIssue}
          shouldShowVotes={shouldShowVotes}
        />
      </CardShell>
    </MotionDiv>
  );
};

export default TicketCard;
