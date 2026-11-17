import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Divider, RadioGroup, FormControlLabel, Radio, Button,
} from '@mui/material';
import { formatBDT } from './common';

// Online payment of land-port charges, shared by the C&F portal and the importer portal.
export default function PayDialog({ open, amount, onClose, onPaid }) {
  const [method, setMethod] = useState('bkash');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Pay land-port charges</DialogTitle>
      <DialogContent>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography color="text.secondary">Amount due</Typography>
          <Typography variant="h6">{formatBDT(amount)}</Typography>
        </Stack>
        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
        <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
          {[['card', 'Card'], ['bkash', 'bKash'], ['nagad', 'Nagad']].map(([v, l]) => (
            <FormControlLabel key={v} value={v} control={<Radio />} label={l} sx={{ border: 1, borderColor: method === v ? 'primary.main' : 'divider', borderRadius: 1.5, m: 0, mb: 1, pr: 2 }} />
          ))}
        </RadioGroup>
        <Typography variant="caption" color="text.secondary">The balance updates only after the payment gateway confirms the payment.</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onPaid}>Complete payment</Button>
      </DialogActions>
    </Dialog>
  );
}
