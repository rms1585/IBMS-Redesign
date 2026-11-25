import { useState } from 'react';
import { Card, Stack, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, Box } from '@mui/material';
import { EmptyState } from './common';

// Administration register: search + table, laid out like the Manifest tracking table (the reference for
// every table): padded card, labelled search above, compact rows inset from the card edge. `columns` = [{ key, label, render?, align?, width? }].
export default function DataTable({ rows, columns, searchKeys = [], searchPlaceholder, toolbar, onRowClick, rowKey = (r, i) => i, pageSize = 10, card = true }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(pageSize);
  const filtered = q
    ? rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())))
    : rows;
  const paged = filtered.slice(page * rpp, page * rpp + rpp);

  const body = (
    <>
      {(searchKeys.length > 0 || toolbar) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
          {searchKeys.length > 0 && (
            <TextField size="small" fullWidth label="Search" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} sx={{ maxWidth: { sm: 520 } }} />
          )}
          <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
          {toolbar}
        </Stack>
      )}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, whiteSpace: 'nowrap' }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((r, ri) => (
              <TableRow key={rowKey(r, ri)} hover={Boolean(onRowClick)} onClick={onRowClick ? () => onRowClick(r) : undefined} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align}>
                    {c.render ? c.render(r) : r[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {filtered.length === 0 && <EmptyState title="No results" description={q ? `Nothing matches “${q}”.` : undefined} />}
      {filtered.length > rpp && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => { setRpp(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </>
  );

  return card ? <Card sx={{ p: { xs: 1.5, sm: 2.5 } }}>{body}</Card> : body;
}
