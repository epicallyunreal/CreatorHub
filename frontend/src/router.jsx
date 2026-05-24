import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import BrandsPage from "./pages/brands/BrandsPage";
import BrandForm from "./pages/brands/BrandForm";
import CreatorsPage from "./pages/creators/CreatorsPage";
import CreatorForm from "./pages/creators/CreatorForm";
import CampaignsPage from "./pages/campaigns/CampaignsPage";
import CampaignForm from "./pages/campaigns/CampaignForm";

import CalendarPage from "./pages/calendar/CalendarPage";
import TemplatesPage from "./pages/templates/TemplatesPage";
import PayoutsPage from "./pages/payouts/PayoutsPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeeForm from "./pages/employees/EmployeeForm";
import RolesPage from "./pages/roles/RolesPage";
import DomainsPage from "./pages/domains/DomainsPage";
import BusinessTypesPage from "./pages/business-types/BusinessTypesPage";
import PlatformsPage from "./pages/platforms/PlatformsPage";
import AdFormatsPage from "./pages/ad-formats/AdFormatsPage";
import TagsPage from "./pages/tags/TagsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import NotificationTemplatesPage from "./pages/notifications/NotificationTemplatesPage";
import ReportsPage from "./pages/reports/ReportsPage";
import AuditPage from "./pages/audit/AuditPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientsPage from "./pages/admin/ClientsPage";
import PlansPage from "./pages/admin/PlansPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Navigate to="/login" replace /> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/brands", element: <BrandsPage /> },
      { path: "/brands/new", element: <BrandForm /> },
      { path: "/brands/:id", element: <Navigate to="edit" replace /> },
      { path: "/brands/:id/edit", element: <BrandForm /> },
      { path: "/creators", element: <CreatorsPage /> },
      { path: "/creators/new", element: <CreatorForm /> },
      { path: "/creators/:id", element: <Navigate to="edit" replace /> },
      { path: "/creators/:id/edit", element: <CreatorForm /> },
      { path: "/campaigns", element: <CampaignsPage /> },
      { path: "/campaigns/new", element: <CampaignForm /> },
      { path: "/campaigns/:id", element: <Navigate to="edit" replace /> },
      { path: "/campaigns/:id/edit", element: <CampaignForm /> },
      { path: "/calendar", element: <CalendarPage /> },
      { path: "/templates", element: <TemplatesPage /> },
      { path: "/payouts", element: <PayoutsPage /> },
      { path: "/invoices", element: <InvoicesPage /> },
      { path: "/employees", element: <EmployeesPage /> },
      { path: "/employees/new", element: <EmployeeForm /> },
      { path: "/employees/:id/edit", element: <EmployeeForm /> },
      { path: "/roles", element: <RolesPage /> },
      { path: "/domains", element: <DomainsPage /> },
      { path: "/business-types", element: <BusinessTypesPage /> },
      { path: "/platforms", element: <PlatformsPage /> },
      { path: "/ad-formats", element: <AdFormatsPage /> },
      { path: "/tags", element: <TagsPage /> },
      { path: "/notifications", element: <NotificationsPage /> },
      { path: "/notifications/templates", element: <NotificationTemplatesPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/audit", element: <AuditPage /> },
    ],
  },
  {
    element: <ProtectedRoute requireSuperAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/clients", element: <ClientsPage /> },
      { path: "/admin/plans", element: <PlansPage /> },
    ],
  },
]);

export default router;
