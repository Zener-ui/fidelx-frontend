import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, Store, Bike, Package, Scale, Banknote, MessageCircle, Bell, Rocket } from "lucide-react";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/vendors", icon: Store, label: "Vendors" },
  { to: "/admin/riders", icon: Bike, label: "Riders" },
  { to: "/admin/orders", icon: Package, label: "Orders" },
  { to: "/admin/disputes", icon: Scale, label: "Disputes" },
  { to: "/admin/withdrawals", icon: Banknote, label: "Payouts" },
  { to: "/admin/support", icon: MessageCircle, label: "Support" },
  { to: "/admin/monitoring", icon: Bell, label: "Alerts" },
  { to: "/admin/pilot", icon: Rocket, label: "Pilot" },
];

export default function AdminLayout() {
  return <AppShell navItems={NAV} subtitle="Admin Panel" contentMaxWidth="max-w-6xl" />;
}
