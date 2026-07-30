import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PublicRoute from "./PublicRoute";
import Loader from "@/components/common/Loader";
import AuthLayout from "@/layouts/AuthLayout";
import CustomerLayout from "@/layouts/CustomerLayout";
import VendorLayout from "@/layouts/VendorLayout";
import RiderLayout from "@/layouts/RiderLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Auth pages
const LoginPage           = lazy(() => import("@/features/auth/LoginPage"));
const RegisterPage        = lazy(() => import("@/features/auth/RegisterPage"));
const ForgotPasswordPage  = lazy(() => import("@/features/auth/ForgotPasswordPage"));
const ResetPasswordPage   = lazy(() => import("@/features/auth/ResetPasswordPage"));
const ChangePasswordPage  = lazy(() => import("@/features/auth/ChangePasswordPage"));

// Customer pages
const CustomerHome        = lazy(() => import("@/features/customer/HomePage"));
const SearchPage          = lazy(() => import("@/features/customer/SearchPage"));
const ProductPage         = lazy(() => import("@/features/customer/ProductPage"));
const CartPage            = lazy(() => import("@/features/customer/CartPage"));
const CheckoutPage        = lazy(() => import("@/features/customer/CheckoutPage"));
const PaymentVerifyPage   = lazy(() => import("@/features/customer/PaymentVerifyPage"));
const OrdersPage          = lazy(() => import("@/features/customer/OrdersPage"));
const OrderDetailPage     = lazy(() => import("@/features/customer/OrderDetailPage"));
const NotificationsPage   = lazy(() => import("@/features/customer/NotificationsPage"));
const ProfilePage         = lazy(() => import("@/features/customer/ProfilePage"));
const ReceiptsPage        = lazy(() => import("@/features/customer/ReceiptsPage"));
const SupportPage         = lazy(() => import("@/features/customer/SupportPage"));

// Vendor pages
const VendorDashboard     = lazy(() => import("@/features/vendor/DashboardPage"));
const VendorProducts      = lazy(() => import("@/features/vendor/ProductsPage"));
const VendorOrders        = lazy(() => import("@/features/vendor/OrdersPage"));
const VendorEarnings      = lazy(() => import("@/features/vendor/EarningsPage"));
const VendorWithdrawals   = lazy(() => import("@/features/vendor/WithdrawalsPage"));
const VendorSettings      = lazy(() => import("@/features/vendor/SettingsPage"));
const VendorOnboarding    = lazy(() => import("@/features/vendor/OnboardingPage"));

// Rider pages
const RiderDashboard      = lazy(() => import("@/features/rider/DashboardPage"));
const RiderOrders         = lazy(() => import("@/features/rider/OrdersPage"));
const RiderEarnings       = lazy(() => import("@/features/rider/EarningsPage"));
const RiderWithdrawals    = lazy(() => import("@/features/rider/WithdrawalsPage"));
const RiderOnboarding     = lazy(() => import("@/features/rider/OnboardingPage"));

// Admin pages
const AdminDashboard      = lazy(() => import("@/features/admin/DashboardPage"));
const AdminVendors        = lazy(() => import("@/features/admin/VendorsPage"));
const AdminRiders         = lazy(() => import("@/features/admin/RidersPage"));
const AdminOrders         = lazy(() => import("@/features/admin/OrdersPage"));
const AdminDisputes       = lazy(() => import("@/features/admin/DisputesPage"));
const AdminWithdrawals    = lazy(() => import("@/features/admin/WithdrawalsPage"));
const AdminPlatformRevenue = lazy(() => import("@/features/admin/PlatformRevenuePage"));
const AdminSupport        = lazy(() => import("@/features/admin/SupportPage"));
const AdminMonitoring     = lazy(() => import("@/features/admin/MonitoringPage"));
const AdminPilot          = lazy(() => import("@/features/admin/PilotPage"));

const Wrap = ({ children }) => (
  <Suspense fallback={<Loader fullscreen />}>{children}</Suspense>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Wrap><LoginPage /></Wrap></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Wrap><RegisterPage /></Wrap></PublicRoute>} />
        <Route path="/forgot-password" element={<Wrap><ForgotPasswordPage /></Wrap>} />
        <Route path="/reset-password" element={<Wrap><ResetPasswordPage /></Wrap>} />
        <Route path="/change-password" element={<ProtectedRoute><Wrap><ChangePasswordPage /></Wrap></ProtectedRoute>} />
      </Route>

      {/* Payment verify (outside layouts — standalone page) */}
      <Route path="/payment/verify" element={<ProtectedRoute><Wrap><PaymentVerifyPage /></Wrap></ProtectedRoute>} />

      {/* Customer */}
      <Route path="/customer" element={<RoleRoute role="customer"><CustomerLayout /></RoleRoute>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home"            element={<Wrap><CustomerHome /></Wrap>} />
        <Route path="search"          element={<Wrap><SearchPage /></Wrap>} />
        <Route path="product/:id"     element={<Wrap><ProductPage /></Wrap>} />
        <Route path="cart"            element={<Wrap><CartPage /></Wrap>} />
        <Route path="checkout"        element={<Wrap><CheckoutPage /></Wrap>} />
        <Route path="orders"          element={<Wrap><OrdersPage /></Wrap>} />
        <Route path="orders/:id"      element={<Wrap><OrderDetailPage /></Wrap>} />
        <Route path="notifications"   element={<Wrap><NotificationsPage /></Wrap>} />
        <Route path="receipts"        element={<Wrap><ReceiptsPage /></Wrap>} />
        <Route path="support"         element={<Wrap><SupportPage /></Wrap>} />
        <Route path="profile"         element={<Wrap><ProfilePage /></Wrap>} />
      </Route>

      {/* Vendor */}
      <Route path="/vendor" element={<RoleRoute role="vendor"><VendorLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="onboarding"    element={<Wrap><VendorOnboarding /></Wrap>} />
        <Route path="dashboard"     element={<Wrap><VendorDashboard /></Wrap>} />
        <Route path="products"      element={<Wrap><VendorProducts /></Wrap>} />
        <Route path="orders"        element={<Wrap><VendorOrders /></Wrap>} />
        <Route path="earnings"      element={<Wrap><VendorEarnings /></Wrap>} />
        <Route path="withdrawals"   element={<Wrap><VendorWithdrawals /></Wrap>} />
        <Route path="settings"      element={<Wrap><VendorSettings /></Wrap>} />
      </Route>

      {/* Rider */}
      <Route path="/rider" element={<RoleRoute role="rider"><RiderLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="onboarding"    element={<Wrap><RiderOnboarding /></Wrap>} />
        <Route path="dashboard"     element={<Wrap><RiderDashboard /></Wrap>} />
        <Route path="orders"        element={<Wrap><RiderOrders /></Wrap>} />
        <Route path="earnings"      element={<Wrap><RiderEarnings /></Wrap>} />
        <Route path="withdrawals"   element={<Wrap><RiderWithdrawals /></Wrap>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<RoleRoute role="admin"><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<Wrap><AdminDashboard /></Wrap>} />
        <Route path="vendors"       element={<Wrap><AdminVendors /></Wrap>} />
        <Route path="riders"        element={<Wrap><AdminRiders /></Wrap>} />
        <Route path="orders"        element={<Wrap><AdminOrders /></Wrap>} />
        <Route path="disputes"      element={<Wrap><AdminDisputes /></Wrap>} />
        <Route path="withdrawals"   element={<Wrap><AdminWithdrawals /></Wrap>} />
        <Route path="platform-revenue" element={<Wrap><AdminPlatformRevenue /></Wrap>} />
        <Route path="support"       element={<Wrap><AdminSupport /></Wrap>} />
        <Route path="monitoring"    element={<Wrap><AdminMonitoring /></Wrap>} />
        <Route path="pilot"         element={<Wrap><AdminPilot /></Wrap>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
