import { Alert, Box, Typography } from '@mui/material';
import { DetailRow } from './common';
import Label from './Label';
import { brtaFitness } from '../data/mock';

// Vehicle fitness by source (F19). BRTA holds fitness only for Bangladeshi-registered vehicles; Indian trucks have no
// record IBMS can reach, so they say so instead of showing a made-up status. Unfit is a warning only: nothing is blocked.
export function fitnessFor(plate, bangladeshi) {
  if (!bangladeshi) return { source: 'none' };
  const record = brtaFitness[plate];
  if (!record) return { source: 'brta', status: 'No BRTA record', unfit: true };
  return { source: 'brta', ...record, unfit: record.status !== 'Fit' };
}

const statusColor = { Fit: 'success', Expired: 'error', Unfit: 'warning', 'No BRTA record': 'warning' };

export function FitnessRow({ plate, bangladeshi, labelWidth }) {
  const f = fitnessFor(plate, bangladeshi);
  return (
    <DetailRow label="Fitness" labelWidth={labelWidth}>
      {f.source === 'none' ? (
        <>
          <Label>No record</Label>
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.5 }}>Indian-registered: BRTA does not cover it</Typography>
        </>
      ) : (
        <>
          <Label color={statusColor[f.status]}>{f.status}</Label>
          <Typography variant="caption" component="p" color="text.secondary" sx={{ mt: 0.5 }}>
            BRTA{f.validTo ? ` · ${f.status === 'Fit' ? 'valid to' : 'expired'} ${f.validTo}` : ''}
          </Typography>
        </>
      )}
    </DetailRow>
  );
}

export function FitnessWarning({ plate, bangladeshi, action }) {
  const f = fitnessFor(plate, bangladeshi);
  if (!f.unfit) return null;
  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <Box component="span" sx={{ fontWeight: 600 }}>BRTA: {f.status}{f.validTo ? ` since ${f.validTo}` : ''}.</Box> This is a warning only; you can still {action}.
    </Alert>
  );
}
