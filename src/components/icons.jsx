import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon, Analytics01Icon, AnalyticsDownIcon, AnalyticsUpIcon, ArrowDataTransferHorizontalIcon, ArrowDown01Icon,
  ArrowLeft01Icon, ArrowRight01Icon, Briefcase01Icon, Bus01Icon, Cancel01Icon, CancelCircleIcon, CheckListIcon,
  CheckmarkCircle02Icon, Clock01Icon, ContainerTruck02Icon, CreditCardIcon, DashboardSquare01Icon, DeliveryTruck01Icon,
  DocumentValidationIcon, Download01Icon, FileUploadIcon, ForkliftIcon, Globe02Icon, GridViewIcon, Home01Icon, InboxIcon,
  Invoice01Icon, LockIcon, Menu01Icon, Moon02Icon, MoreHorizontalIcon, MoreVerticalIcon, Notification01Icon, Notification03Icon,
  Plug01Icon, Route01Icon, Search01Icon, SignpostIcon, SlidersHorizontalIcon, StopWatchIcon, Store01Icon, Sun03Icon,
  Tick02Icon, Train01Icon, UnavailableIcon, UserGroupIcon, UserShield01Icon, Video01Icon, WarehouseIcon, WeightScaleIcon,
} from '@hugeicons/core-free-icons';

// Icons follow the IBMS Figma design system: Hugeicons, Stroke Rounded, 1.5px stroke.
// Each export keeps the name and props (fontSize, color, sx) of the MUI icon it replaced.

const sizes = { small: 20, medium: 24, large: 35, inherit: 'inherit' };

const paletteColor = (color) => {
  if (!color || color === 'inherit') return undefined;
  if (color === 'disabled') return 'text.disabled';
  if (color === 'action') return 'action.active';
  return `${color}.main`;
};

function createIcon(icon, displayName) {
  const Icon = forwardRef(function Icon({ fontSize = 'medium', color, sx, strokeWidth = 1.5, ...rest }, ref) {
    return (
      <Box
        component="span"
        ref={ref}
        aria-hidden="true"
        {...rest}
        sx={{
          display: 'inline-flex',
          flexShrink: 0,
          width: '1em',
          height: '1em',
          fontSize: typeof fontSize === 'number' ? fontSize : sizes[fontSize],
          color: paletteColor(color),
          '& > svg': { width: '1em', height: '1em' },
          ...sx,
        }}
      >
        <HugeiconsIcon icon={icon} size={24} strokeWidth={strokeWidth} color="currentColor" />
      </Box>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

export const AddRoundedIcon = createIcon(Add01Icon, 'AddRoundedIcon');
export const AdminPanelSettingsRoundedIcon = createIcon(UserShield01Icon, 'AdminPanelSettingsRoundedIcon');
export const AltRouteRoundedIcon = createIcon(Route01Icon, 'AltRouteRoundedIcon');
export const BlockRoundedIcon = createIcon(UnavailableIcon, 'BlockRoundedIcon');
export const BusinessCenterRoundedIcon = createIcon(Briefcase01Icon, 'BusinessCenterRoundedIcon');
export const CancelRoundedIcon = createIcon(CancelCircleIcon, 'CancelRoundedIcon');
export const CheckRoundedIcon = createIcon(Tick02Icon, 'CheckRoundedIcon');
export const CheckCircleRoundedIcon = createIcon(CheckmarkCircle02Icon, 'CheckCircleRoundedIcon');
export const ChevronLeftRoundedIcon = createIcon(ArrowLeft01Icon, 'ChevronLeftRoundedIcon');
export const ChevronRightRoundedIcon = createIcon(ArrowRight01Icon, 'ChevronRightRoundedIcon');
export const CloseRoundedIcon = createIcon(Cancel01Icon, 'CloseRoundedIcon');
export const DarkModeOutlinedIcon = createIcon(Moon02Icon, 'DarkModeOutlinedIcon');
export const DirectionsBusRoundedIcon = createIcon(Bus01Icon, 'DirectionsBusRoundedIcon');
export const FileDownloadOutlinedIcon = createIcon(Download01Icon, 'FileDownloadOutlinedIcon');
export const GridViewRoundedIcon = createIcon(GridViewIcon, 'GridViewRoundedIcon');
export const HistoryRoundedIcon = createIcon(Clock01Icon, 'HistoryRoundedIcon');
export const HomeRoundedIcon = createIcon(Home01Icon, 'HomeRoundedIcon');
export const InboxOutlinedIcon = createIcon(InboxIcon, 'InboxOutlinedIcon');
export const InboxRoundedIcon = createIcon(InboxIcon, 'InboxRoundedIcon');
export const InsightsRoundedIcon = createIcon(Analytics01Icon, 'InsightsRoundedIcon');
export const KeyboardArrowDownRoundedIcon = createIcon(ArrowDown01Icon, 'KeyboardArrowDownRoundedIcon');
export const LightModeOutlinedIcon = createIcon(Sun03Icon, 'LightModeOutlinedIcon');
export const LocalShippingRoundedIcon = createIcon(ContainerTruck02Icon, 'LocalShippingRoundedIcon');
export const LockOutlinedIcon = createIcon(LockIcon, 'LockOutlinedIcon');
export const MenuRoundedIcon = createIcon(Menu01Icon, 'MenuRoundedIcon');
export const MoreHorizRoundedIcon = createIcon(MoreHorizontalIcon, 'MoreHorizRoundedIcon');
export const MoreVertRoundedIcon = createIcon(MoreVerticalIcon, 'MoreVertRoundedIcon');
export const NotificationsActiveRoundedIcon = createIcon(Notification03Icon, 'NotificationsActiveRoundedIcon');
export const NotificationsNoneRoundedIcon = createIcon(Notification01Icon, 'NotificationsNoneRoundedIcon');
export const PaymentsRoundedIcon = createIcon(CreditCardIcon, 'PaymentsRoundedIcon');
export const PeopleAltRoundedIcon = createIcon(UserGroupIcon, 'PeopleAltRoundedIcon');
export const PrecisionManufacturingRoundedIcon = createIcon(ForkliftIcon, 'PrecisionManufacturingRoundedIcon');
export const PublicRoundedIcon = createIcon(Globe02Icon, 'PublicRoundedIcon');
export const ReceiptLongRoundedIcon = createIcon(DocumentValidationIcon, 'ReceiptLongRoundedIcon');
export const RequestQuoteRoundedIcon = createIcon(Invoice01Icon, 'RequestQuoteRoundedIcon');
export const RuleRoundedIcon = createIcon(CheckListIcon, 'RuleRoundedIcon');
export const RvHookupRoundedIcon = createIcon(DeliveryTruck01Icon, 'RvHookupRoundedIcon');
export const ScaleRoundedIcon = createIcon(WeightScaleIcon, 'ScaleRoundedIcon');
export const SearchRoundedIcon = createIcon(Search01Icon, 'SearchRoundedIcon');
export const SettingsEthernetRoundedIcon = createIcon(Plug01Icon, 'SettingsEthernetRoundedIcon');
export const SignpostRoundedIcon = createIcon(SignpostIcon, 'SignpostRoundedIcon');
export const StorefrontRoundedIcon = createIcon(Store01Icon, 'StorefrontRoundedIcon');
export const SyncAltRoundedIcon = createIcon(ArrowDataTransferHorizontalIcon, 'SyncAltRoundedIcon');
export const TimerOutlinedIcon = createIcon(StopWatchIcon, 'TimerOutlinedIcon');
export const TrainRoundedIcon = createIcon(Train01Icon, 'TrainRoundedIcon');
export const TrendingDownRoundedIcon = createIcon(AnalyticsDownIcon, 'TrendingDownRoundedIcon');
export const TrendingUpRoundedIcon = createIcon(AnalyticsUpIcon, 'TrendingUpRoundedIcon');
export const TuneRoundedIcon = createIcon(SlidersHorizontalIcon, 'TuneRoundedIcon');
export const UploadFileRoundedIcon = createIcon(FileUploadIcon, 'UploadFileRoundedIcon');
export const VideocamOutlinedIcon = createIcon(Video01Icon, 'VideocamOutlinedIcon');
export const VideocamRoundedIcon = createIcon(Video01Icon, 'VideocamRoundedIcon');
export const ViewQuiltRoundedIcon = createIcon(DashboardSquare01Icon, 'ViewQuiltRoundedIcon');
export const WarehouseRoundedIcon = createIcon(WarehouseIcon, 'WarehouseRoundedIcon');
