import { useState } from 'react';
import { Card, Stack, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { SearchField, EmptyState } from './common';
import { RowCards } from '../demo/ui';
import { tr } from '../i18n/LanguageContext';

// Administration register: search + table; on a phone the rows become cards, so nothing scrolls sideways.
// Administration register columns: `columns` = [{ key, label, render?, align?, width? }].
export default function DataTable({ rows, columns, searchKeys = [], searchPlaceholder, toolbar, onRowClick, rowKey = (r, i) => i, dense, pageSize = 10, card = true }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(pageSize);
  const filtered = q
    ? rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())))
    : rows;
  const paged = filtered.slice(page * rpp, page * rpp + rpp);
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const asCards = columns.map((c) => ({ label: typeof c.label === 'string' ? c.label : '', render: c.render ?? ((r) => r[c.key]) }));
  const placeholder = tr(searchPlaceholder);

  const body = (
    <>
      {(searchKeys.length > 0 || toolbar) && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2.5 }}>
          {searchKeys.length > 0 && <SearchField placeholder={placeholder} value={q} onChange={(v) => { setQ(v); setPage(0); }} sx={{ flex: 1 }} />}
          {toolbar}
        </Stack>
      )}
      {phone ? (
        paged.length > 0 && <Box sx={{ px: 2, pb: 2 }}><RowCards columns={asCards} rows={paged} rowKey={rowKey} onRowClick={onRowClick} /></Box>
      ) : (
      <Box sx={{ overflowX: 'auto' }}>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                {columns.map((c, i) => (
                  <TableCell key={c.key} align={c.align} sx={{ width: c.width, whiteSpace: 'nowrap', ...(i === 0 && { pl: 3 }), ...(i === columns.length - 1 && { pr: 3 }) }}>
                    {tr(c.label)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r, ri) => (
                <TableRow key={rowKey(r, ri)} hover onClick={onRowClick ? () => onRowClick(r) : undefined} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                  {columns.map((c, i) => (
                    <TableCell key={c.key} align={c.align} sx={{ ...(i === 0 && { pl: 3 }), ...(i === columns.length - 1 && { pr: 3 }) }}>
                      {c.render ? c.render(r) : r[c.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
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

  return card ? <Card>{body}</Card> : body;
}
