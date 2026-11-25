import { AdminPanelSettingsRoundedIcon, AltRouteRoundedIcon, BusinessCenterRoundedIcon, DirectionsBusRoundedIcon, GridViewRoundedIcon, HistoryRoundedIcon, HomeRoundedIcon, InboxRoundedIcon, InsightsRoundedIcon, LocalShippingRoundedIcon, PaymentsRoundedIcon, PeopleAltRoundedIcon, PrecisionManufacturingRoundedIcon, PublicRoundedIcon, ReceiptLongRoundedIcon, RequestQuoteRoundedIcon, RuleRoundedIcon, RvHookupRoundedIcon, ScaleRoundedIcon, SettingsEthernetRoundedIcon, ShieldRoundedIcon, SignpostRoundedIcon, StorefrontRoundedIcon, SyncAltRoundedIcon, TrainRoundedIcon, TuneRoundedIcon, ViewQuiltRoundedIcon, WarehouseRoundedIcon, LockOutlinedIcon } from '../components/icons';

// Modules follow the M2 module list (Annex 7, M-01 to M-20). Home shows the same groups in the same order.
export const navConfig = [
  {
    subheader: 'Overview',
    items: [
      { title: 'Home', path: '/', icon: <HomeRoundedIcon /> },
      { title: 'Inbox', path: '/inbox', icon: <InboxRoundedIcon /> },
      { title: 'Dashboard', path: '/dashboard', icon: <InsightsRoundedIcon /> },
      { title: 'Manifest tracking', path: '/manifests', icon: <ReceiptLongRoundedIcon /> },
    ],
  },
  {
    subheader: 'Operations',
    items: [
      { title: 'Border gate', path: '/border-gate', icon: <LocalShippingRoundedIcon /> },
      { title: 'Weighbridge', path: '/weighbridge', icon: <ScaleRoundedIcon /> },
      { title: 'Posting and holding area', path: '/posting', icon: <GridViewRoundedIcon /> },
      { title: 'Warehousing', path: '/warehousing', icon: <WarehouseRoundedIcon /> },
      { title: 'Transshipment', path: '/transshipment', icon: <SyncAltRoundedIcon /> },
      { title: 'Inland gate', path: '/inland-gate', icon: <SignpostRoundedIcon /> },
      { title: 'Billing and payment', path: '/billing', icon: <PaymentsRoundedIcon /> },
      { title: 'Labour and roster', path: '/labour', icon: <PeopleAltRoundedIcon /> },
      { title: 'Cargo vehicle terminal', path: '/vehicle-terminal', icon: <RvHookupRoundedIcon /> },
      { title: 'Auction and disposal', path: '/auction', icon: <HistoryRoundedIcon /> },
    ],
  },
  {
    subheader: 'Portals and agencies',
    items: [
      { title: 'C&F portal', path: '/cf-portal', icon: <BusinessCenterRoundedIcon /> },
      { title: 'Importer portal', path: '/trader-portal', icon: <StorefrontRoundedIcon /> },
      { title: 'Customs workspace', path: '/customs', icon: <ShieldRoundedIcon /> },
    ],
  },
  {
    subheader: 'Administration and configuration',
    items: [
      { title: 'Port setup', path: '/port-setup', icon: <TuneRoundedIcon /> },
      { title: 'Warehouse layout', path: '/warehouse-layout', icon: <ViewQuiltRoundedIcon /> },
      { title: 'Storage rules', path: '/storage-rules', icon: <RuleRoundedIcon /> },
      { title: 'Exception catalogue', path: '/exceptions', icon: <RuleRoundedIcon /> },
      { title: 'Products and routing', path: '/routing', icon: <AltRouteRoundedIcon /> },
      { title: 'Vehicle classes', path: '/vehicle-classes', icon: <RvHookupRoundedIcon /> },
      { title: 'Equipment and labour', path: '/equipment', icon: <PrecisionManufacturingRoundedIcon /> },
      { title: 'What this port charges', path: '/charges', icon: <RequestQuoteRoundedIcon /> },
      { title: 'C&F licences', path: '/licences', icon: <LockOutlinedIcon /> },
      { title: 'Technical settings', path: '/technical', icon: <SettingsEthernetRoundedIcon /> },
    ],
  },
  {
    subheader: 'Access and control',
    items: [
      { title: 'Roles', path: '/roles', icon: <AdminPanelSettingsRoundedIcon /> },
      { title: 'Users', path: '/users', icon: <PeopleAltRoundedIcon /> },
      { title: 'Audit log', path: '/audit', icon: <HistoryRoundedIcon /> },
    ],
  },
  {
    subheader: 'Platform',
    items: [
      { title: 'Platform setup', path: '/platform', icon: <PublicRoundedIcon /> },
      { title: 'External status', path: '/external', icon: <SettingsEthernetRoundedIcon /> },
    ],
  },
  {
    subheader: 'Other flows',
    items: [
      { title: 'Export', path: '/export', icon: <PublicRoundedIcon /> },
      { title: 'Rail cargo', path: '/rail', icon: <TrainRoundedIcon /> },
      { title: 'Passenger and bus terminal', path: '/passenger', icon: <DirectionsBusRoundedIcon /> },
    ],
  },
];

export const flatNav = navConfig.flatMap((g) => g.items.map((i) => ({ ...i, group: g.subheader })));
