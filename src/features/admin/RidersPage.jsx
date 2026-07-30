import { useState } from "react";
import { Bike } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAdminRiders, approveRider, strikeRider } from "@/api/admin";
import { formatDate } from "@/utils";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const STATUS_COLORS = { pending:"text-yellow-400", approved:"text-teal", suspended:"text-red-400" };

export default function AdminRidersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");

  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["admin-riders", tab], queryFn: () => getAdminRiders(tab) });
  const riders = data?.riders || [];

  const approveMutation = useMutation({
    mutationFn: async (rider) => {
      try {
        return await approveRider(rider.id);
      } catch (err) {
        const message = err?.message || "";
        const ninBlocked =
          /NIN/i.test(message) &&
          /(not passed|not verified|verification|failed|status)/i.test(message);

        if (!ninBlocked) throw err;

        const approveAnyway = window.confirm(
          `This rider's NIN has not passed verification (status: ${rider.nin_verification_status || "not verified"}).\n\nApprove anyway?`
        );

        if (!approveAnyway) throw new Error("Approval cancelled");

        return approveRider(rider.id, {
          override: true,
          override_reason: "Admin approved rider despite NIN verification failure."
        });
      }
    },
    onSuccess: () => {
      toast.success("Rider approved");
      qc.invalidateQueries(["admin-riders"]);
    },
    onError: (err) => {
      if (err?.message !== "Approval cancelled") toast.error(err.message);
    },
  });

  const strikeMutation = useMutation({
    mutationFn: strikeRider,
    onSuccess: (d) => { toast.success(d?.suspended ? "Rider suspended after 3 strikes" : "Strike issued"); qc.invalidateQueries(["admin-riders"]); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Riders</h1>
      <div className="flex gap-2 mb-4">
        {["pending","approved","suspended"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border capitalize transition-all ${tab === t ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted bg-surface"}`}>
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : riders.length === 0 ? (
        <EmptyState icon={Bike} title={`No ${tab} riders`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {riders.map((r) => (
              <div key={r.id} className="p-4 bg-surface rounded-2xl border border-surface-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-ink font-semibold">{r.users?.full_name}</p>
                    <p className="text-slate-muted text-xs">{r.users?.email} · {r.phone}</p>
                    <p className="text-slate-muted text-xs">
                      NIN: <span className="text-ink font-medium">{r.nin || "Not provided"}</span>
                      {" · "}
                      {r.nin_verified ? "Verified" : (r.nin_verification_status || "Not verified")}
                      {" · Vehicle: "}{r.vehicle_type}
                    </p>
                    <p className="text-slate-muted text-xs">Strikes: {r.strike_count}/3</p>
                  </div>
                  <span className={`text-xs font-semibold capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-muted text-xs">{formatDate(r.created_at)}</p>
                  <div className="flex gap-2">
                    {r.status === "approved" && (
                      <Button size="sm" variant="danger" onClick={() => { if (window.confirm("Issue strike to this rider?")) strikeMutation.mutate(r.id); }}>
                        Strike
                      </Button>
                    )}
                    {r.status === "pending" && (
                      <Button size="sm" onClick={() => approveMutation.mutate(r)} loading={approveMutation.isPending}>Approve</Button>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
