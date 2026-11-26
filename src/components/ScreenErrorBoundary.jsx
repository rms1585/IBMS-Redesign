import { Component } from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { tr } from '../i18n/LanguageContext';

// The system-error state (M2 Annex 24.4): when a screen fails, only that screen shows this message, the menu and top
// bar keep working, and the person gets a help-desk reference to quote. Keyed by the address, so moving to
// another screen clears it.
export default class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { reference: null };
  }

  static getDerivedStateFromError() {
    return { reference: `HD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(Date.now() % 10000).padStart(4, '0')}` };
  }

  componentDidCatch(error) {
    // Kept for the browser console and the demo's error check; a live system sends it to the help desk.
    console.error(error);
  }

  render() {
    const { reference } = this.state;
    if (!reference) return this.props.children;
    return (
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, maxWidth: 640 }} role="alert">
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>{tr('This screen could not be shown')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {tr('Nothing you saved is lost, and other screens still work. Reload to try again. If it happens again, call the help desk and quote this reference.')}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 3, fontFamily: 'monospace' }}>{reference}</Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={() => window.location.reload()}>{tr('Reload')}</Button>
          <Button variant="outlined" color="inherit" onClick={() => { window.location.hash = '#/'; }}>{tr('Go to Home')}</Button>
        </Stack>
      </Paper>
    );
  }
}
