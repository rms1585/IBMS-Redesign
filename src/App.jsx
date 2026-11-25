import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import useAutoHideScrollbars from './hooks/useAutoHideScrollbars';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CfPortal from './pages/CfPortal';
import CfManifest from './pages/CfManifest';
import TraderPortal from './pages/TraderPortal';
import Manifests from './pages/Manifests';
import GateWorkbench from './pages/GateWorkbench';
import Weighbridge from './pages/Weighbridge';
import Posting from './pages/Posting';
import Warehousing from './pages/Warehousing';
import Transshipment from './pages/Transshipment';
import Billing from './pages/Billing';
import PlatformSetup from './pages/PlatformSetup';
import PortSetup from './pages/PortSetup';
import WarehouseLayout from './pages/WarehouseLayout';
import StorageRules from './pages/StorageRules';
import Routing from './pages/Routing';
import VehicleClasses from './pages/VehicleClasses';
import Equipment from './pages/Equipment';
import Charges from './pages/Charges';
import Technical from './pages/Technical';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Inbox from './pages/Inbox';
import Labour from './pages/Labour';
import RailCargo from './pages/RailCargo';
import Passenger from './pages/Passenger';
import Exceptions from './pages/Exceptions';
import AuditLog from './pages/AuditLog';
import InlandGate from './pages/InlandGate';
import CustomsWorkspace from './pages/CustomsWorkspace';
import ExternalStatus from './pages/ExternalStatus';
import Licences from './pages/Licences';

export default function App() {
  useAutoHideScrollbars();
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cf-portal" element={<CfPortal />} />
        <Route path="cf-portal/:manifestId" element={<CfManifest />} />
        <Route path="trader-portal" element={<TraderPortal />} />
        <Route path="manifests" element={<Manifests />} />
        <Route path="manifests/:manifestId" element={<Manifests />} />
        <Route path="border-gate" element={<GateWorkbench />} />
        <Route path="inland-gate" element={<InlandGate />} />
        <Route path="customs" element={<CustomsWorkspace />} />
        <Route path="external" element={<ExternalStatus />} />
        <Route path="licences" element={<Licences />} />
        <Route path="weighbridge" element={<Weighbridge />} />
        <Route path="posting" element={<Posting />} />
        <Route path="warehousing" element={<Warehousing />} />
        <Route path="transshipment" element={<Transshipment />} />
        <Route path="billing" element={<Billing />} />
        <Route path="platform" element={<PlatformSetup />} />
        <Route path="port-setup" element={<PortSetup />} />
        <Route path="warehouse-layout" element={<WarehouseLayout />} />
        <Route path="storage-rules" element={<StorageRules />} />
        <Route path="routing" element={<Routing />} />
        <Route path="vehicle-classes" element={<VehicleClasses />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="charges" element={<Charges />} />
        <Route path="technical" element={<Technical />} />
        <Route path="roles" element={<Roles />} />
        <Route path="users" element={<Users />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="labour" element={<Labour />} />
        {/* The Exit Pass and Part delivery screens are replaced by the inland gate and the Delivery Request (M2 3.4.10). */}
        <Route path="exit-pass" element={<Navigate to="/inland-gate" replace />} />
        <Route path="part-delivery" element={<Navigate to="/cf-portal" replace />} />
        {/* Folded into their parent modules (M2 Annex 24.12); old links open the matching view. */}
        <Route path="vehicle-terminal" element={<Navigate to="/posting?view=terminal" replace />} />
        <Route path="auction" element={<Navigate to="/warehousing?view=aging" replace />} />
        <Route path="export" element={<Navigate to="/inland-gate?view=export" replace />} />
        <Route path="rail" element={<RailCargo />} />
        <Route path="passenger" element={<Passenger />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="truck-queue" element={<Navigate to="/posting" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
