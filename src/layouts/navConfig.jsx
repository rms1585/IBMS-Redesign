import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import SignpostRoundedIcon from '@mui/icons-material/SignpostRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import AltRouteRoundedIcon from '@mui/icons-material/AltRouteRounded';
import RvHookupRoundedIcon from '@mui/icons-material/RvHookupRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import SettingsEthernetRoundedIcon from '@mui/icons-material/SettingsEthernetRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import TrainRoundedIcon from '@mui/icons-material/TrainRounded';
import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded';
import { inboxRequests } from '../data/mock';

const pendingForMe = inboxRequests.filter((r) => !r.mine).length;

export const navConfig = [
  {
    subheader: 'Overview',
    items: [
      { title: 'Home', path: '/', icon: <HomeRoundedIcon /> },
      { title: 'Dashboard', path: '/dashboard', icon: <InsightsRoundedIcon /> },
    ],
  },
  {
    subheader: 'Operations',
    items: [
      { title: 'C&F portal', path: '/cf-portal', icon: <BusinessCenterRoundedIcon /> },
      { title: 'Importer / exporter', path: '/trader-portal', icon: <StorefrontRoundedIcon /> },
      { title: 'Manifest tracking', path: '/manifests', icon: <ReceiptLongRoundedIcon /> },
      { title: 'Border gate', path: '/border-gate', icon: <LocalShippingRoundedIcon /> },
      { title: 'Weighbridge', path: '/weighbridge', icon: <ScaleRoundedIcon /> },
      { title: 'Posting', path: '/posting', icon: <GridViewRoundedIcon /> },
      { title: 'Warehousing', path: '/warehousing', icon: <WarehouseRoundedIcon /> },
      { title: 'Transshipment', path: '/transshipment', icon: <SyncAltRoundedIcon /> },
      { title: 'Billing & payment', path: '/billing', icon: <PaymentsRoundedIcon /> },
      { title: 'Inland gate', path: '/inland-gate', icon: <SignpostRoundedIcon /> },
    ],
  },
  {
    subheader: 'Administration',
    items: [
      { title: 'Platform setup', path: '/platform', icon: <PublicRoundedIcon /> },
      { title: 'Port setup', path: '/port-setup', icon: <TuneRoundedIcon /> },
      { title: 'Warehouse layout', path: '/warehouse-layout', icon: <ViewQuiltRoundedIcon /> },
      { title: 'Storage rules', path: '/storage-rules', icon: <RuleRoundedIcon /> },
      { title: 'Products & routing', path: '/routing', icon: <AltRouteRoundedIcon /> },
      { title: 'Vehicle classes', path: '/vehicle-classes', icon: <RvHookupRoundedIcon /> },
      { title: 'Equipment & labour', path: '/equipment', icon: <PrecisionManufacturingRoundedIcon /> },
      { title: 'What this port charges', path: '/charges', icon: <RequestQuoteRoundedIcon /> },
      { title: 'Technical settings', path: '/technical', icon: <SettingsEthernetRoundedIcon /> },
      { title: 'Roles', path: '/roles', icon: <AdminPanelSettingsRoundedIcon /> },
      { title: 'Users', path: '/users', icon: <PeopleAltRoundedIcon /> },
      { title: 'Inbox', path: '/inbox', icon: <InboxRoundedIcon />, badge: pendingForMe },
      { title: 'Audit log', path: '/audit', icon: <HistoryRoundedIcon /> },
    ],
  },
  {
    subheader: 'Coming soon',
    items: [
      { title: 'Rail cargo', path: '/rail', icon: <TrainRoundedIcon />, disabled: true },
      { title: 'Passenger', path: '/passenger', icon: <DirectionsBusRoundedIcon />, disabled: true },
    ],
  },
];

export const flatNav = navConfig.flatMap((g) => g.items.map((i) => ({ ...i, group: g.subheader })));
