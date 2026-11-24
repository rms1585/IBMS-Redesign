import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Stack, Typography } from '@mui/material';
import Logo from '../../components/Logo';
import Label from '../../components/Label';
import { usesBlocks } from './config';
import { CALLBACK_PATH, completeSignIn, currentUser, signOut, startSignIn } from './session';

// On the hosted site every screen needs a Blocks sign-in, because the shared port data is open to
// signed-in users only. Elsewhere (the local dev server) the gate lets everything through.

const SessionContext = createContext({ user: null, signOut: null });

export const useSession = () => useContext(SessionContext);

export function FullScreen({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
            <Logo />
            <Label color="warning">Demonstration system</Label>
          </Stack>
          {children}
        </Stack>
      </Card>
    </Box>
  );
}

export function Waiting({ text }) {
  return (
    <FullScreen>
      <Stack direction="row" spacing={1.5} alignItems="center" role="status">
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">{text}</Typography>
      </Stack>
    </FullScreen>
  );
}

function SignIn({ problem }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(problem);
  const go = async () => {
    setPending(true);
    setError(null);
    try {
      await startSignIn();
    } catch {
      setPending(false);
      setError("Couldn't reach Blocks sign-in. Check your connection and try again.");
    }
  };
  return (
    <FullScreen>
      <Box>
        <Typography variant="h5" sx={{ mb: 1 }}>Sign in</Typography>
        <Typography variant="body2" color="text.secondary">
          Everyone signed in works on the same demo port, so what one person records shows on the others' screens. Demo data only.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" onClick={go} disabled={pending} startIcon={pending ? <CircularProgress size={18} color="inherit" /> : null}>
        {pending ? 'Opening sign-in' : 'Sign in with Blocks'}
      </Button>
      <Typography variant="caption" color="text.secondary">No account? Ask the demo owner for an invitation.</Typography>
    </FullScreen>
  );
}

function BlocksSession({ children }) {
  const [state, setState] = useState({ status: 'checking', user: null, problem: null });
  const started = useRef(false);

  const check = useCallback(async (problem = null) => {
    const user = await currentUser();
    setState(user ? { status: 'signed-in', user, problem: null } : { status: 'signed-out', user: null, problem });
  }, []);

  useEffect(() => {
    // Strict Mode runs effects twice; the sign-in code can be used only once.
    if (started.current) return;
    started.current = true;
    if (window.location.pathname !== CALLBACK_PATH) {
      check();
      return;
    }
    completeSignIn()
      .then((returnTo) => {
        window.history.replaceState(null, '', `/${returnTo}`);
        return check("Sign-in finished but Blocks didn't keep the session. Try again.");
      })
      .catch((e) => {
        window.history.replaceState(null, '', '/');
        setState({ status: 'signed-out', user: null, problem: `Sign-in didn't complete: ${e.message}` });
      });
  }, [check]);

  // A session can end in another tab or expire while this one is hidden.
  useEffect(() => {
    const recheck = () => document.visibilityState === 'visible' && state.status === 'signed-in' && check('Your session ended. Sign in again.');
    document.addEventListener('visibilitychange', recheck);
    return () => document.removeEventListener('visibilitychange', recheck);
  }, [check, state.status]);

  const end = useCallback(async () => {
    await signOut();
    setState({ status: 'signed-out', user: null, problem: null });
  }, []);

  if (state.status === 'checking') return <Waiting text="Checking your sign-in" />;
  if (state.status === 'signed-out') return <SignIn problem={state.problem} />;
  return <SessionContext.Provider value={{ user: state.user, signOut: end }}>{children}</SessionContext.Provider>;
}

export default function SessionGate({ children }) {
  return usesBlocks() ? <BlocksSession>{children}</BlocksSession> : children;
}
