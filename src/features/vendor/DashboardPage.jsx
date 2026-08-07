import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Wallet, Landmark, Star, Settings, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { getVendorEarnings } from "@/api/vendors";
import { getVendorSubOrders } from "@/api/orders";
import { updateAvailability } from "@/api/vendors";
import { getMyVendorProfile } from "@/api/vendors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatNaira, getStatusDisplay, getAvailabilityDisplay } from "@/utils";
import { useAuthStore } from "@/store/authStore";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";
import toast from "react-hot-toast";

const AVAIL_OPTIONS = ["OPEN","BUSY","CLOSED","TEMPORARILY_UNAVAILABLE"];

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: profileData } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const { data: earningsData, isLoading: earningsLoading } = useQuery({ queryKey: ["vendor-earnings"], queryFn: getVendorEarnings });
  const { data: ordersData } = useQuery({ queryKey: ["vendor-suborders"], queryFn: getVendorSubOrders, refetchInterval: 30000 });

  const availMutation = useMutation({
    mutationFn: updateAvailability,
    onSuccess: () => { toast.success("Availability updated"); qc.invalidateQueries(["vendor-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  const vendor = profileData?.vendor;
  const earnings = earningsData;
  const activeOrders = ordersData?.sub_orders?.filter((o) => !["DELIVERED","CANCELLED","REFUNDED"].includes(o.status)) || [];
  const avail = getAvailabilityDisplay(vendor?.availability_status);

  return (
    <div className="min-h-screen">
      <TopBar title="Dashboard" right={
        <div className="flex items-center gap-2">
          <Link to="/vendor/notifications" className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center">
            <Bell className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </Link>
          <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
        </div>
      } />

      <div className="px-4 py-3 space-y-4">
        {/* Store status */}
        <Card className="p-4">
          <p className="text-slate-muted text-xs mb-2 font-medium uppercase tracking-wide">Store Status</p>
          <div className="flex gap-2 flex-wrap">
            {AVAIL_OPTIONS.map((s) => (
              <button key={s} onClick={() => availMutation.mutate({ availability_status: s })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${vendor?.availability_status === s ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </Card>

        {/* Earnings summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Available", value: earnings?.available_balance, color: "text-teal" },
            { label: "Pending",   value: earnings?.pending_balance,   color: "text-yellow-400" },
            { label: "Total Earned",   value: earnings?.total_earned,     color: "text-ink" },
            { label: "Withdrawn", value: earnings?.total_withdrawn,  color: "text-slate-muted" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-slate-muted text-xs mb-1">{label}</p>
              {earningsLoading ? <Skeleton className="h-7 w-24" /> : (
                <p className={`text-xl font-black ${color}`}>{formatNaira(value)}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Active orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink font-semibold text-sm">Active Orders ({activeOrders.length})</h2>
            <Link to="/vendor/orders" className="text-teal text-xs">See all →</Link>
          </div>
          {activeOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-slate-muted text-sm">No active orders</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeOrders.slice(0, 3).map((o) => {
                const s = getStatusDisplay(o.status);
                return (
                  <Card key={o.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-ink text-xs font-semibold">#{o.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-slate-muted text-[10px]">{o.delivery_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/vendor/products",    icon: Package, label: "Products" },
            { to: "/vendor/orders",      icon: ShoppingBag, label: "Orders" },
            { to: "/vendor/earnings",    icon: Wallet, label: "Earnings" },
            { to: "/vendor/withdrawals", icon: Landmark, label: "Withdraw" },
            { to: "/vendor/reviews",     icon: Star, label: "Reviews" },
            { to: "/vendor/settings",    icon: Settings, label: "Settings" },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}>
              <Card hover className="p-4 flex items-center gap-3">
                <Icon className="w-6 h-6 text-teal flex-shrink-0" />
                <span className="text-ink text-sm font-medium">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
