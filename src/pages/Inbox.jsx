import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Alert, Snackbar, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { PageHeader, SearchField, EmptyState, UserAvatar, ReasonDialog, AssumptionNote } from '../components/common';
import Label from '../components/Label';
import { inboxRequests, decidedRequests, currentUser } from '../data/mock';
import { useTruckWeights, AUTHORITIES } from '../TruckWeightsContext';
import { useCfAlerts } from '../CfAlertsContext';
import { useAudit } from '../AuditContext';

const kindColor = {
  'Port go-live': 'primary', 'Sensitive role assignment': 'error', 'Bill adjustment': 'warning',
  'Storage-rule override': 'warning', 'Manual-status confirmation': 'info', Correction: 'info', 'Module change': 'secondary', 'Early re-weigh': 'warning',
};

// An early re-weigh needs both the Customs AC and the BLPA AD, each with remarks (F31). In this demo one person
// decides for whichever authority is still pending; in IBMS each would sign in as themselves (#78).
function ReweighDecision({ app, onClose, onSave }) {
  const pending = Object.keys(AUTHORITIES).filter((k) => !app.decisions[k]);
  const [authority, setAuthority] = useState(pending[0]);
  const [decision, setDecision] = useState('Approved');
  const [remarks, setRemarks] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Decide {app.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Re-weigh <Box component="span" sx={{ fontFamily: 'monospace' }}>{app.plate}</Box> early: {app.reason}
        </Typography>
        <Stack spacing={2}>
          <TextField select fullWidth label="Deciding as" value={authority} onChange={(e) => setAuthority(e.target.value)}>
            {pending.map((k) => <MenuItem key={k} value={k}>{AUTHORITIES[k]}</MenuItem>)}
          </TextField>
          <ToggleButtonGroup exclusive fullWidth color={decision === 'Approved' ? 'primary' : 'error'} value={decision} onChange={(e, v) => v && setDecision(v)}>
            <ToggleButton value="Approved">Approve</ToggleButton>
            <ToggleButton value="Rejected">Reject</ToggleButton>
          </ToggleButtonGroup>
          <TextField fullWidth required multiline minRows={3} label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} helperText="Required from both authorities. Recorded in the audit log with your name and time." />
        </Stack>
        <AssumptionNote code="F31" sx={{ mt: 2 }}>How the Customs Assistant Commissioner signs in IBMS is to be confirmed with NBR.</AssumptionNote>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color={decision === 'Approved' ? 'primary' : 'error'} disabled={!remarks.trim()} onClick={() => onSave(authority, decision, remarks.trim())}>
          {decision === 'Approved' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Each authority's decision on an early re-weigh, or that it is still waiting.
function ReweighDecisions({ app }) {
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {Object.entries(AUTHORITIES).map(([k, name]) => {
        const d = app.decisions[k];
        return (
          <Stack key={k} direction="row" spacing={1} alignItems="flex-start">
            <Label color={d ? (d.decision === 'Approved' ? 'success' : 'error') : 'default'}>{d ? d.decision : 'Waiting'}</Label>
            <Typography variant="body2" color="text.secondary">{name}{d && <> · {d.by}: “{d.remarks}”</>}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

// Store applications shown in the same rows as the other requests.
const asRequest = (a) => ({
  id: a.id, kind: 'Early re-weigh', summary: `Re-weigh ${a.plate} early on ${a.manifest}: ${a.reason}`, requester: a.requester, port: 'BEN', at: a.at,
  app: a, decision: a.status === 'Waiting' ? undefined : a.status,
});

export default function Inbox() {
  const [tab, setTab] = useState('waiting');
  const [waiting, setWaiting] = useState(inboxRequests);
  const [decided, setDecided] = useState(decidedRequests);
  const [search, setSearch] = useState('');
  const [decide, setDecide] = useState(null);
  const [toast, setToast] = useState('');
  const [deciding, setDeciding] = useState(null);
  const { applications, decideApplication } = useTruckWeights();
  const { addAlert } = useCfAlerts();
  const { addEvent } = useAudit();
  const reweighWaiting = applications.filter((a) => a.status === 'Waiting').map(asRequest);
  const reweighDecided = applications.filter((a) => a.status !== 'Waiting').map(asRequest);

  const match = (r) => `${r.summary} ${r.requester} ${r.port ?? ''}`.toLowerCase().includes(search.toLowerCase());
  const list = (tab === 'waiting' ? [...reweighWaiting, ...waiting] : [...reweighDecided, ...decided]).filter(match);

  const recordReweigh = (authority, decision, remarks) => {
    const app = deciding;
    const status = decideApplication(app.id, authority, decision, remarks, currentUser.name);
    addEvent({
      actor: currentUser.name, role: AUTHORITIES[authority], module: 'Approvals', type: 'Approval',
      text: `${decision} early re-weigh ${app.id} for ${app.plate} as ${AUTHORITIES[authority]}: ${remarks}`,
    });
    if (status !== 'Waiting') {
      addAlert({ manifest: app.manifest, text: status === 'Approved' ? `Early re-weigh ${app.id} approved. ${app.plate} is weighed empty before it leaves.` : `Early re-weigh ${app.id} rejected.` });
    }
    setToast(status === 'Approved'
      ? `${app.id} approved by both. Re-weigh ordered and the weighbridge is notified.`
      : status === 'Rejected' ? `${app.id} rejected. The C&F agency is told.` : `${app.id}: your decision is recorded. Waiting for the other authority.`);
    setDeciding(null);
  };

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
          <Tab value="waiting" label={<Stack direction="row" spacing={1} alignItems="center"><span>Waiting for you</span><Label color="error">{waiting.filter((r) => !r.mine).length + reweighWaiting.length}</Label></Stack>} />
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
                    {r.decision && !r.app && <> · {r.decision} by {r.decider}: “{r.reason}”</>}
                  </Typography>
                  {r.app && <ReweighDecisions app={r.app} />}
                </Box>
                {tab === 'waiting' ? (
                  r.app ? (
                    <Button variant="contained" onClick={() => setDeciding(r.app)}>Decide</Button>
                  ) : r.mine ? (
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
      {deciding && <ReweighDecision app={deciding} onClose={() => setDeciding(null)} onSave={recordReweigh} />}
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
