import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Alert, Snackbar, Tooltip } from '@mui/material';
import { PageHeader, SearchField, EmptyState, UserAvatar, ReasonDialog } from '../components/common';
import Label from '../components/Label';
import { inboxRequests, decidedRequests, currentUser } from '../data/mock';

const kindColor = {
  'Port go-live': 'primary', 'Sensitive role assignment': 'error', 'Bill adjustment': 'warning',
  'Storage-rule override': 'warning', 'Manual-status confirmation': 'info', Correction: 'info', 'Module change': 'secondary',
};

export default function Inbox() {
  const [tab, setTab] = useState('waiting');
  const [waiting, setWaiting] = useState(inboxRequests);
  const [decided, setDecided] = useState(decidedRequests);
  const [search, setSearch] = useState('');
  const [decide, setDecide] = useState(null);
  const [toast, setToast] = useState('');

  const match = (r) => `${r.summary} ${r.requester} ${r.port ?? ''}`.toLowerCase().includes(search.toLowerCase());
  const list = (tab === 'waiting' ? waiting : decided).filter(match);

  const record = (reason) => {
    const { req, decision } = decide;
    setWaiting((w) => w.filter((x) => x.id !== req.id));
    setDecided((d) => [{ ...req, decision, decider: currentUser.name, at: 'Just now', reason }, ...d]);
    setToast(`${req.id} ${decision.toLowerCase()}.`);
    setDecide(null);
  };

  return (
    <>
      <PageHeader title="Inbox" links={[{ name: 'Administration' }, { name: 'Inbox' }]} subtitle="Maker-checker decisions. A reviewer must hold the relevant permission and cannot decide their own request." />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab value="waiting" label={<Stack direction="row" spacing={1} alignItems="center"><span>Waiting for you</span><Label color="error">{waiting.filter((r) => !r.mine).length}</Label></Stack>} />
          <Tab value="decided" label="Decided" />
        </Tabs>
        <SearchField placeholder="Search summary, person or port" value={search} onChange={setSearch} />
      </Stack>
      <Card>
        {list.length === 0 ? (
          <EmptyState title={tab === 'waiting' ? 'Nothing is waiting for you' : 'No decisions yet'} description={tab === 'waiting' ? 'New requests appear here when they need your decision.' : undefined} sx={{ py: 10 }} />
        ) : (
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {list.map((r) => (
              <Stack key={r.id} direction="row" spacing={2} alignItems="center" sx={{ p: 3 }}>
                <UserAvatar name={r.requester === 'Head office' ? 'Head Office' : r.requester} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Label color={kindColor[r.kind] ?? 'default'}>{r.kind}</Label>
                    <Typography variant="caption" color="text.disabled">{r.id} · {r.at}</Typography>
                  </Stack>
                  <Typography variant="subtitle2">{r.summary}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested by {r.requester}{r.port ? ` · ${r.port}` : ''}
                    {r.decision && <> · {r.decision} by {r.decider}: “{r.reason}”</>}
                  </Typography>
                </Box>
                {tab === 'waiting' ? (
                  r.mine ? (
                    <Tooltip title="You made this request, so another authorised person must decide it.">
                      <span><Label>Your request</Label></span>
                    </Tooltip>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" color="error" onClick={() => setDecide({ req: r, decision: 'Rejected' })}>Reject</Button>
                      <Button variant="contained" onClick={() => setDecide({ req: r, decision: 'Approved' })}>Approve</Button>
                    </Stack>
                  )
                ) : (
                  <Label color={r.decision === 'Approved' ? 'success' : 'error'}>{r.decision}</Label>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
      <ReasonDialog
        open={Boolean(decide)}
        title={decide ? `${decide.decision === 'Approved' ? 'Approve' : 'Reject'} ${decide.req.id}?` : ''}
        description={decide?.req.summary}
        confirmLabel={decide?.decision === 'Approved' ? 'Approve' : 'Reject'}
        confirmColor={decide?.decision === 'Approved' ? 'primary' : 'error'}
        onClose={() => setDecide(null)}
        onConfirm={record}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
