import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getVendorEarnings } from "@/api/vendors";
import { formatNaira, formatDate, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";

export default function VendorEarningsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["vendor-earnings"], queryFn: getVendorEarnings });

  return (
    <div className="min-h-screen">
      <TopBar title="Earnings" />
      <div className="px-4 py-3 space-y-4">
        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Available",    value: data?.available_balance, color: "text-teal",         desc: "Ready to withdraw" },
            { label: "Pending",      value: data?.pending_balance,   color: "text-yellow-400",   desc: "Releases after delivery" },
            { label: "Total Earned", value: data?.total_earned,      color: "text-ink",        desc: "All time" },
            { label: "Withdrawn",    value: data?.total_withdrawn,   color: "text-slate-muted",  desc: "All time" },
          ].map(({ label, value, color, desc }) => (
            <Card key={label} className="p-4">
              <p className="text-slate-muted text-xs">{label}</p>
              {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className={`text-xl font-black mt-1 ${color}`}>{formatNaira(value)}</p>}
              <p className="text-slate-muted text-[10px] mt-1">{desc}</p>
            </Card>
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={() => navigate("/vendor/withdrawals")}>
          Request Withdrawal
        </Button>

        {/* Recent transactions */}
        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">Recent Sales</h3>
          {isLoading
            ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl mb-2" />)
            : data?.sub_orders?.slice(0, 20).map((o) => {
                const s = getStatusDisplay(o.status);
                const locked = o.status !== "DELIVERED";
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
                    <div>
                      <p className="text-ink text-xs font-semibold">#{o.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-slate-muted text-[10px]">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${locked ? "text-slate-muted" : "text-teal"}`}>{formatNaira(o.vendor_payout)}</p>
                      <span className={`text-[10px] ${s.color}`}>{locked ? "Locked" : "Released"}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
