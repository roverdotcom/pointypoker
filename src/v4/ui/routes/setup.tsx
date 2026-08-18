import { AnimatePresence } from 'motion/react';
import { div as AnimatedContainer } from 'motion/react-client';
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router';

import styled, { css } from 'styled-components';

import ArrowSvg from '@assets/icons/arrow-right.svg?react';
import LogoSvg from '@assets/pointy-poker.svg?react';
import {
  Button,
  TextInput,
} from '@components/common';
import Logo from '@components/Header/logo';
import { Card } from '@mantine/core';
import { LoadingIcon } from '@modules/preferences/panes/integrations/jira/components';
import { useMobile } from '@utils/hooks/mobile';
import { ThemedProps } from '@utils/styles/colors/types';
import useAuth from '@v4/api/hooks/use-auth';
import useSession from '@v4/api/hooks/use-session';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 12rem;
  padding: 1rem;
`;

const Icon = styled(LogoSvg)`
  ${({ theme }: ThemedProps) => css`
    > path {
      fill: ${theme.primary.accent11};
    }

    filter: drop-shadow(0 0.125rem 0.125rem ${theme.primary.accent1});
  `}

  width: 5rem;
  height: 5rem;
  margin-bottom: 1rem;
`;

const ArrowIcon = styled(ArrowSvg)`
  height: 1.5rem;
  width: 1.5rem;
`;

const HeaderWrapper = styled.div`
  flex-direction: column;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
`;

const Header = styled.h2<ThemedProps>`
  ${({ isNarrow }) => css`
    flex-direction: ${isNarrow ? 'column' : 'row'};
  `}

  justify-content: center;
  align-items: center;
  font-weight: 500;
  display: flex;
`;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;

  > p {
    font-weight: 100;
    margin-bottom: 0;
  }
`;

const Form = styled.form`
  display: flex;
  align-items: center;
  padding: 1rem 0;
  width: 100%;
`;

const StartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
`;

const ButtonContainer = styled.div`
  width: 100%;
  padding: 0.5rem 0;
`;

const Message = styled.p`
  ${({ theme }: ThemedProps) => css`
    color: ${theme.greyscale.accent11};
  `}

  text-align: center;
`;

const Spinner = styled(LoadingIcon)`
  height: 2.5rem;
  width: 2.5rem;
`;

const Setup = () => {
  const { status: authStatus, signIn } = useAuth();
  const { status: sessionStatus, createSession } = useSession();
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { isNarrow } = useMobile();

  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const conditionalWidth = useMemo(() => (isNarrow ? '90%' : '40rem'), [isNarrow]);

  const handleSignIn = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name) {
      await signIn(name);
    }
  }, [name, signIn]);

  const handleStart = useCallback(async () => {
    setIsCreating(true);
    try {
      const created = await createSession();
      navigate(`/${created}`);
    } catch {
      setIsCreating(false);
    }
  }, [createSession, navigate]);

  const loadingBlock = (label?: string) => (
    <Content>
      <Spinner />
      {label ? <Message>{label}</Message> : null}
    </Content>
  );

  const nameForm = (
    <Content>
      <HeaderWrapper>
        <Icon />
        <Header isNarrow={isNarrow}>welcome to&nbsp;<Logo /></Header>
      </HeaderWrapper>
      <FormWrapper>
        <p>what do we call you?</p>
        <Form autoComplete='off' onSubmit={handleSignIn}
          role='user name'>
          <TextInput
            alignment='left'
            collapse
            id='name'
            onChange={({ target }) => setName(target.value)}
            placeHolder='your name'
            value={name}
          />
          <Button
            refresh
            round
            style={{ margin: '0 0 0 0.75rem' }}
            textSize='small'
            type='submit'
            variation='info'
            width={3}
          >
            <ArrowIcon />
          </Button>
        </Form>
      </FormWrapper>
    </Content>
  );

  const startSession = (missing?: boolean) => (
    <Content>
      <HeaderWrapper>
        <Icon />
        <Header isNarrow={isNarrow}>ready to start?</Header>
      </HeaderWrapper>
      <StartWrapper>
        {missing ? <Message>we couldn&apos;t find that session — start a new one?</Message> : null}
        <ButtonContainer>
          <Button
            loading={isCreating}
            onClick={handleStart}
            refresh
            variation='info'
            width='full'
          >
            start a session
          </Button>
        </ButtonContainer>
      </StartWrapper>
    </Content>
  );

  let content: React.ReactNode;
  if (authStatus === 'initializing') {
    content = loadingBlock();
  } else if (authStatus === 'unauthenticated') {
    content = nameForm;
  } else if (roomName) {
    // A room is in the URL: SessionProvider auto-joins. Keep loading until it
    // resolves; surface a fallback only when the session is missing/errored.
    content = sessionStatus === 'not-found' || sessionStatus === 'error'
      ? startSession(true)
      : loadingBlock('joining session…');
  } else {
    content = startSession();
  }

  return (
    <Wrapper>
      <AnimatePresence mode='wait'>
        <AnimatedContainer
          key={authStatus === 'unauthenticated' ? 'name' : 'session'}
          animate={{
            filter: 'blur(0rem)',
            opacity: 1,
            transform: 'perspective(500px) rotateX(0deg) translateZ(0px) translateY(0px)',
            width: conditionalWidth,
          }}
          exit={{
            filter: 'blur(1rem)',
            opacity: 0,
            transform: 'perspective(500px) rotateX(-10deg) translateZ(-90px) translateY(20px)',
            width: conditionalWidth,
          }}
          initial={{
            filter: 'blur(1rem)',
            opacity: 0,
            transform: 'perspective(500px) rotateX(-10deg) translateZ(-90px) translateY(20px)',
            width: conditionalWidth,
          }}
          transition={{ duration: 0.3 }}
        >
          <Card radius={'lg'} withBorder>
            {content}
          </Card>
        </AnimatedContainer>
      </AnimatePresence>
    </Wrapper>
  );
};

export default Setup;
