import { Box, Stack, Typography, Alert } from '@mui/material';
import Label from './Label';
import { STEP } from '../CustomsContext';

export function CustomsLabel({ customs, prefix = '' }) {
  return <Label color={customs.color}>{prefix}{customs.label}</Label>;
}

// The steps this consignment goes through, done or still to come. Yellow and Red channels add an examination.
const expectedSteps = (customs) => {
  if (!customs.boe) return customs.released ? [STEP.released] : [STEP.filed, STEP.assessed, STEP.paid, STEP.released];
  const examined = ['Yellow', 'Red'].includes(customs.channel);
  return [STEP.filed, ...(examined ? [STEP.examined] : []), STEP.assessed, STEP.paid, STEP.released];
};

const sourceText = (step) => (step.source === 'Paper'
  ? `From paper, Release Order ${step.ref} · confirmed by ${step.by}`
  : 'via BNSW');

// Each Customs step with when it arrived and where from. No duty amounts: BLPA needs signals, not Customs data (#81).
export default function CustomsSteps({ customs }) {
  const steps = expectedSteps(customs);
  return (
    <Box>
      {customs.onHold && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>On hold since {customs.hold.at}.</Box> {customs.hold.reason}. Delivery and departure are blocked until Customs lifts it.
        </Alert>
      )}
      {steps.map((name, i) => {
        const done = customs.steps.find((s) => s.name === name);
        const last = i === steps.length - 1;
        return (
          <Stack key={name} direction="row" spacing={2}>
            <Stack alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', mt: 0.75, bgcolor: done ? (name === STEP.released ? 'success.main' : 'primary.main') : 'grey.400' }} />
              {!last && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
            </Stack>
            <Box sx={{ pb: last ? 0 : 2 }}>
              <Typography variant="body2" color={done ? 'text.primary' : 'text.disabled'}>
                {name}
                {name === STEP.filed && customs.boe && <> · <Box component="span" sx={{ fontFamily: 'monospace' }}>{customs.boe}</Box> · {customs.channel} channel</>}
              </Typography>
              <Typography variant="caption" color="text.disabled">{done ? `${done.at} · ${sourceText(done)}` : 'Not yet'}</Typography>
              {done && name === STEP.released && (
                <Typography variant="caption" color="text.secondary" component="p">
                  Covers every agency certificate (Plant Quarantine, BSTI, fisheries, livestock). BLPA checks nothing else.
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}
    </Box>
  );
}
