import { Box, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { exceptionRegister } from '../data/exceptions';
import { tr } from '../i18n/LanguageContext';

// Read-only: M2 sets each exception once for all ports (Annex 3.5). Where a BLPA post decides, BLPA names the
// officer, time limit and night delegate in Administration before the pilot.
const wrap = (children, sx) => <Box component="span" sx={{ whiteSpace: 'normal', display: 'block', ...sx }}>{children}</Box>;

export default function Exceptions() {
  return (
    <>
      <PageHeader
        title={tr('Exception register')}
        links={[{ name: 'Administration and configuration' }, { name: 'Exception register' }]}
        subtitle={tr('M2 Annex 3.5: one definition of each exception, the same at every port. EXC-12 and EXC-13 are withdrawn: only perishables move truck to truck.')}
      />
      <DataTable
        rows={exceptionRegister}
        searchKeys={['id', 'name', 'flows', 'decider', 'trigger']}
        searchPlaceholder={tr('Search ID, exception, flow or who decides')}
        rowKey={(r) => r.id}
        pageSize={10}
        columns={[
          { key: 'id', label: 'ID', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'name', label: 'Exception', render: (r) => wrap(<><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary" component="div">{tr('When')}: {r.trigger}</Typography></>, { minWidth: 240 }) },
          { key: 'flows', label: 'Flows', render: (r) => wrap(r.flows, { minWidth: 90 }) },
          { key: 'decider', label: 'Who decides', render: (r) => <Label>{r.decider}</Label> },
          { key: 'does', label: 'What IBMS does', render: (r) => wrap(<Typography variant="body2" color="text.secondary">{r.does}</Typography>, { minWidth: 260 }) },
        ]}
      />
    </>
  );
}
