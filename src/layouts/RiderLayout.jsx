import AppShell from "@/components/layout/AppShell";
import { Bike, Package, Wallet, Landmark } from "lucide-react";

const NAV = [
  { to: "/rider/dashboard", icon: Bike, label: "Dashboard" },
  { to: "/rider/orders", icon: Package, label: "Orders" },
  { to: "/rider/earnings", icon: Wallet, label: "Earnings" },
  { to: "/rider/withdrawals", icon: Landmark, label: "Withdraw" },
];

export default function RiderLayout() {
  return <AppShell navItems={NAV} subtitle="Rider Panel" />;
}
