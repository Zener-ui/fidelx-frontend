import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Input from "./Input";
import Button from "./Button";
import { getBanks, resolveBankAccount } from "@/api/withdrawals";

export default function BankAccountFields({ value, onChange, errors = {} }) {
  const [verified, setVerified] = useState(false);
  const { data, isLoading: banksLoading } = useQuery({
    queryKey: ["paystack-banks"],
    queryFn: getBanks,
    staleTime: 1000 * 60 * 60 * 12,
  });

  const banks = data?.banks || [];

  const resolveMutation = useMutation({
    mutationFn: resolveBankAccount,
    onSuccess: (response) => {
      const accountName = response?.account?.account_name;
      if (!accountName) {
        setVerified(false);
        toast.error("Paystack could not verify that account.");
        return;
      }
      onChange({
        ...value,
        account_name: accountName,
        verified_account_name: accountName,
      });
      setVerified(true);
      toast.success("Bank account verified ✓");
    },
    onError: (err) => {
      setVerified(false);
      onChange({ ...value, account_name: "", verified_account_name: "" });
      toast.error(err.message || "Could not verify bank account");
    },
  });

  useEffect(() => {
    setVerified(false);
  }, [value.bank_code, value.bank_account]);

  const canVerify =
    value.bank_code &&
    /^\d{10}$/.test(String(value.bank_account || ""));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-soft">Bank</label>
        <select
          value={value.bank_code || ""}
          disabled={banksLoading}
          onChange={(e) => {
            const selected = banks.find((b) => b.code === e.target.value);
            onChange({
              ...value,
              bank_code: e.target.value,
              bank_name: selected?.name || "",
              account_name: "",
              verified_account_name: "",
            });
            setVerified(false);
          }}
          className={`w-full mt-1 bg-surface rounded-xl border ${
            errors.bank_code ? "border-red-400" : "border-surface-border"
          } text-ink px-4 py-3 text-sm outline-none focus:border-teal`}
        >
          <option value="">{banksLoading ? "Loading banks..." : "Select bank"}</option>
          {banks.map((bank) => (
            <option key={`${bank.code}-${bank.name}`} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
        {errors.bank_code && <p className="text-xs text-red-400 mt-1">{errors.bank_code}</p>}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Account Number"
            inputMode="numeric"
            maxLength={10}
            value={value.bank_account || ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange({
                ...value,
                bank_account: digits,
                account_name: "",
                verified_account_name: "",
              });
              setVerified(false);
            }}
            error={errors.bank_account}
          />
        </div>
        <Button
          type="button"
          className="mb-0.5"
          disabled={!canVerify || resolveMutation.isPending}
          onClick={() => resolveMutation.mutate({
            account_number: value.bank_account,
            bank_code: value.bank_code,
          })}
          loading={resolveMutation.isPending}
        >
          Verify
        </Button>
      </div>

      <Input
        label="Verified Account Name"
        value={value.account_name || ""}
        disabled
        helper={verified ? "Verified by Paystack. This name cannot be edited." : "Verify the account number before submitting."}
        error={errors.account_name}
      />
    </div>
  );
}
