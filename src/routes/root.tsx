import {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet, useLocation } from 'react-router';

import styled, { ThemeProvider } from 'styled-components';

import Header from '@components/Header';
import { MantineProvider } from '@mantine/core';
import Menu from '@modules/menu';
import Modal from '@modules/modal';
import usePreferenceSync from '@modules/preferences/hooks';
import { AuthProvider } from '@modules/user';
import { usePostHog } from '@posthog/react';
import { ROUTE_PATHS } from '@routes/constants';
import { isV4Experience } from '@utils';
import { FlagName } from '@utils/flags';
import useStore from '@utils/store';
import { GlobalStyles } from '@utils/styles';
import useTheme from '@utils/styles/colors';
import RootContainer from '@v4/ui/root-container';

import '../App.css';

export type ContextType = {
  refHeight: number;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: 80rem;
  height: 100vh;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
`;

const ChildrenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

const Root: FC = () => {
  usePreferenceSync();

  const posthog = usePostHog();
  const [isPosthogInitialized, setIsPosthogInitialized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { setFlag } = useStore(({ setFlag }) => (
    { setFlag }));
  const {
    mantineConfig,
    theme,
    themeMode,
  } = useTheme();
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const shouldShowMenu = useMemo(() => (
    location.pathname !== ROUTE_PATHS.JIRA_REDIRECT
  ), [location.pathname]);

  /** Initialization and subscription to PostHog feature flags */
  useEffect(() => {
    if (posthog) {
      if (!isPosthogInitialized) {
        const deployVersion = import.meta.env.VITE_VERSION;
        posthog.setPersonProperties({ deployVersion });
        localStorage.setItem('lastRunVersion', JSON.stringify(deployVersion));
        setIsPosthogInitialized(true);
      } else {
        posthog.onFeatureFlags((_, variants) => {
          Object.entries(variants).forEach(([flag, isEnabled]) => {
            setFlag(flag as FlagName, !!isEnabled);
          });
        });
      }
    }
  }, [
    isPosthogInitialized,
    posthog,
    setFlag,
  ]);

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <MantineProvider
        defaultColorScheme={'auto'}
        forceColorScheme={themeMode}
        theme={mantineConfig}
      >
        {isV4Experience() ? <RootContainer /> : (
          // v3 auth is scoped to the v3 experience; v4 owns auth via its own AuthProvider.
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <GlobalStyles/>
              <Container>
                <Header
                  headerRef={headerRef}
                  hideMenu={!shouldShowMenu}
                  isMenuOpen={isMenuOpen}
                  toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
                />
                <Modal />
                <Menu
                  closeMenu={() => setIsMenuOpen(false)}
                  isOpen={shouldShowMenu && isMenuOpen}
                />
                <ChildrenWrapper>
                  <Outlet context={{ refHeight: headerRef?.current?.clientHeight ?? 0 } satisfies ContextType} />
                </ChildrenWrapper>
              </Container>
            </ThemeProvider>
          </AuthProvider>
        )}
      </MantineProvider>
    </ErrorBoundary>
  );
};

export default Root;
