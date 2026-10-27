import { inboxRequests } from '../data/mock';
import { AdminPanelSettingsRoundedIcon, AltRouteRoundedIcon, BusinessCenterRoundedIcon, DirectionsBusRoundedIcon, GridViewRoundedIcon, HistoryRoundedIcon, HomeRoundedIcon, InboxRoundedIcon, InsightsRoundedIcon, LocalShippingRoundedIcon, PaymentsRoundedIcon, PeopleAltRoundedIcon, PrecisionManufacturingRoundedIcon, PublicRoundedIcon, ReceiptLongRoundedIcon, RequestQuoteRoundedIcon, RuleRoundedIcon, RvHookupRoundedIcon, ScaleRoundedIcon, SettingsEthernetRoundedIcon, SignpostRoundedIcon, StorefrontRoundedIcon, SyncAltRoundedIcon, TrainRoundedIcon, TuneRoundedIcon, ViewQuiltRoundedIcon, WarehouseRoundedIcon } from '../components/icons';

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
