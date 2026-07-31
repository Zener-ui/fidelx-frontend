import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { getBanks, resolveAccount } from "@/api/withdrawals";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function BankAccountFields({
  form,
  setForm,
  errors = {},
  verifiedAccount,
  setVerifiedAccount,
}) {
  const { data, isLoading: banksLoading, isError: banksError } = useQuery({
    queryKey: ["paystack-banks"],
    queryFn: getBanks,
    staleTime: 1000 * 60 * 60,
  });

  const banks = data?.banks || [];

  const verifyMutation = useMutation({
    mutationFn: resolveAccount,
    onSuccess: (response) => {
      const account = response.account;
      setVerifiedAccount(account);
      setForm((current) => ({
        ...current,
        bank_account: account.account_number,
        bank_code: account.bank_code,
        bank_name: account.bank_name || current.bank_name,
        account_name: account.account_name,
      }));
      toast.success("Bank account verified");
    },
    onError: (err) => {
      setVerifiedAccount(null);
      setForm((current) => ({ ...current, account_name: "" }));
      toast.error(err.message || "Could not verify this account");
    },
  });

  useEffect(() => {
    if (!form.bank_code || !form.bank_account) return;
    setVerifiedAccount(null);
    setForm((current) => ({ ...current, account_name: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.bank_code, form.bank_account]);

  const canVerify =
    form.bank_code &&
    /^\d{10}$/.test(String(form.bank_account || "").replace(/\D/g, ""));

  const verify = () => {
    if (!canVerify) {
      toast.error("Select a bank and enter a valid 10-digit account number.");
      return;
    }
    verifyMutation.mutate({
      bank_code: form.bank_code,
      account_number: String(form.bank_account).replace(/\D/g, ""),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-ink mb-1.5">Bank</label>
        <select
          value={form.bank_code || ""}
          disabled={banksLoading}
          onChange={(e) => {
            const code = e.target.value;
            const bank = banks.find((item) => String(item.code) === code);
            setVerifiedAccount(null);
            setForm((current) => ({
              ...current,
              bank_code: code,
              bank_name: bank?.name || "",
              account_name: "",
            }));
          }}
          className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
        >
          <option value="">
            {banksLoading ? "Loading banks..." : "Select your bank"}
          </option>
          {banks.map((bank) => (
            <option key={`${bank.code}-${bank.name}`} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
        {banksError && (
          <p className="text-red-400 text-xs mt-1">
            Could not load banks. Try again.
          </p>
        )}
      </div>

      <Input
        label="Account Number"
        inputMode="numeric"
        maxLength={10}
        value={form.bank_account}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
          setVerifiedAccount(null);
          setForm((current) => ({
            ...current,
            bank_account: value,
            account_name: "",
          }));
        }}
        error={errors.bank_account}
      />

      <Button
        type="button"
        variant="secondary"
        onClick={verify}
        disabled={!canVerify || verifyMutation.isPending}
        loading={verifyMutation.isPending}
        className="w-full"
      >
        Verify Account
      </Button>

      <div
        className={`rounded-xl border p-3 ${
          verifiedAccount
            ? "border-teal/30 bg-teal/5"
            : "border-surface-border bg-surface"
        }`}
      >
        <p className="text-slate-muted text-[10px] uppercase tracking-wide">
          Verified account name
        </p>
        <div className="flex items-center gap-2 mt-1">
          {verifiedAccount && <CheckCircle2 size={16} className="text-teal" />}
          <p className="text-ink text-sm font-semibold">
            {verifiedAccount?.account_name || "Verify your account to continue"}
          </p>
        </div>
      </div>
    </div>
  );
}
