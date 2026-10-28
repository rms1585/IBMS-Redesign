import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import useAutoHideScrollbars from './hooks/useAutoHideScrollbars';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CfPortal from './pages/CfPortal';
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
import AuditLog from './pages/AuditLog';

export default function App() {
  useAutoHideScrollbars();
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cf-portal" element={<CfPortal />} />
        <Route path="trader-portal" element={<TraderPortal />} />
        <Route path="manifests" element={<Manifests />} />
        <Route path="border-gate" element={<GateWorkbench side="border" />} />
        <Route path="inland-gate" element={<GateWorkbench side="inland" />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
