import { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tr } from '../i18n/LanguageContext';

// A named approval is signed on the device: the record keeps the name, the time and the signature image, and the
// approver confirms a second sign-in factor (M-13; Section 4.15). The code check is simulated in the demo.
export default function SignAndConfirm({ person, onChange }) {
  const theme = useTheme();
  const canvas = useRef(null);
  const drawing = useRef(false);
  const [image, setImage] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    onChange(image && /^\d{6}$/.test(code) ? { image, factor: true } : null);
  }, [image, code, onChange]);

  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * canvas.current.width, ((e.clientY - r.top) / r.height) * canvas.current.height];
  };
  const start = (e) => {
    drawing.current = true;
    canvas.current.setPointerCapture(e.pointerId);
    const ctx = canvas.current.getContext('2d');
    ctx.strokeStyle = theme.palette.text.primary;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...point(e));
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvas.current.getContext('2d');
    ctx.lineTo(...point(e));
    ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setImage(canvas.current.toDataURL('image/png'));
  };
  const clear = () => {
    canvas.current.getContext('2d').clearRect(0, 0, canvas.current.width, canvas.current.height);
    setImage('');
  };

  return (
    <Stack spacing={1.5}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Signature of {person}</Typography>
          <Button size="small" color="inherit" onClick={clear} disabled={!image}>{tr("Clear")}</Button>
        </Stack>
        <Box
          component="canvas"
          ref={canvas}
          width={480}
          height={120}
          aria-label={`Signature pad for ${person}. Draw your signature with a mouse, pen or finger.`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          sx={{ display: 'block', width: '100%', maxWidth: 480, height: 120, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.neutral', touchAction: 'none', cursor: 'crosshair' }}
        />
      </Box>
      <TextField
        size="small"
        label={tr("Code from your authenticator")}
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        helperText={tr("Second sign-in factor for a named approval. Demo: any six digits.")}
        sx={{ maxWidth: 280 }}
      />
    </Stack>
  );
}
