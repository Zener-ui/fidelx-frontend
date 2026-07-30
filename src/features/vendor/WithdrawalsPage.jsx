import { useState } from "react";
import { Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyWithdrawals, requestVendorWithdrawal, getFeePreview } from "@/api/withdrawals";
import { getVendorEarnings } from "@/api/vendors";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";

const STATUS_COLORS = { PENDING:"text-yellow-400", APPROVED:"text-teal", COMPLETED:"text-teal", REJECTED:"text-red-400", FAILED:"text-red-400" };

export default function VendorWithdrawalsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", bank_account: "", bank_name: "", account_name: "" });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const { data: earningsData } = useQuery({ queryKey: ["vendor-earnings"], queryFn: getVendorEarnings });
  const { data: withdrawalData, isLoading } = useQuery({ queryKey: ["my-withdrawals"], queryFn: getMyWithdrawals });
  const available = earningsData?.available_balance || 0;
  const withdrawals = withdrawalData?.withdrawals || [];

  const previewMutation = useMutation({
    mutationFn: (amount) => getFeePreview(amount),
    onSuccess: (d) => setPreview(d.breakdown),
    onError: () => setPreview(null),
  });

  const withdrawMutation = useMutation({
    mutationFn: requestVendorWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      qc.invalidateQueries(["my-withdrawals"]);
      qc.invalidateQueries(["vendor-earnings"]);
      setModalOpen(false);
      setForm({ amount: "", bank_account: "", bank_name: "", account_name: "" });
      setPreview(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (Number(form.amount) > available) e.amount = `Exceeds available balance of ${formatNaira(available)}`;
    if (!form.bank_account.trim()) e.bank_account = "Required";
    if (!form.bank_name.trim()) e.bank_name = "Required";
    if (!form.account_name.trim()) e.account_name = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAmountBlur = () => {
    if (form.amount && Number(form.amount) > 0) previewMutation.mutate(Number(form.amount));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    withdrawMutation.mutate({ ...form, amount: Number(form.amount) });
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Withdrawals" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-muted text-xs">Available Balance</p>
            <p className="text-teal text-2xl font-black">{formatNaira(available)}</p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={available <= 0}>Withdraw</Button>
        </Card>

        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">Withdrawal History</h3>
          {isLoading ? null : withdrawals.length === 0
            ? <EmptyState icon={Banknote} title="No withdrawals yet" />
            : withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
                  <div>
                    <p className="text-ink text-xs font-semibold">{formatNaira(w.net_payout)}</p>
                    <p className="text-slate-muted text-[10px]">Fee: {formatNaira(w.withdrawal_fee)} {w.fee_was_capped ? "(capped)" : ""}</p>
                    <p className="text-slate-muted text-[10px]">{formatDate(w.requested_at)}</p>
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[w.status] || "text-slate-muted"}`}>{w.status}</span>
                </div>
              ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Withdrawal">
        <div className="space-y-3">
          <div className="p-3 bg-teal/5 border border-teal/20 rounded-xl">
            <p className="text-teal text-xs font-medium">Available: {formatNaira(available)}</p>
          </div>
          <Input label="Amount (₦)" type="number" min="1" max={available}
            value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            onBlur={handleAmountBlur} error={errors.amount} />

          {preview && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-muted">Gross</span><span className="text-ink">{formatNaira(preview.gross_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-muted">Fee (1%{preview.fee_was_capped ? " capped" : ""})</span><span className="text-red-400">-{formatNaira(preview.withdrawal_fee)}</span></div>
              <div className="flex justify-between font-bold border-t border-surface-border pt-1"><span className="text-ink">You receive</span><span className="text-teal">{formatNaira(preview.net_payout)}</span></div>
            </div>
          )}

          <Input label="Account Number" value={form.bank_account} onChange={(e) => setForm((f) => ({ ...f, bank_account: e.target.value }))} error={errors.bank_account} />
          <Input label="Bank Name" placeholder="e.g. GTBank" value={form.bank_name} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} error={errors.bank_name} />
          <Input label="Account Name" value={form.account_name} onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))} error={errors.account_name} />
          <Button size="xl" onClick={handleSubmit} loading={withdrawMutation.isPending}>Submit Request</Button>
        </div>
      </Modal>
    </div>
  );
}
