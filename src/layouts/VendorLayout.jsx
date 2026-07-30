import AppShell from "@/components/layout/AppShell";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Settings } from "lucide-react";

const NAV = [
  { to: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vendor/products", icon: Package, label: "Products" },
  { to: "/vendor/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/vendor/earnings", icon: Wallet, label: "Earnings" },
  { to: "/vendor/settings", icon: Settings, label: "Settings" },
];

export default function VendorLayout() {
  return <AppShell navItems={NAV} subtitle="Vendor Panel" />;
}
