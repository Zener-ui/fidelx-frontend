/**
 * WITHDRAWALS API
 * Paystack bank details are verified by the Fidelx backend.
 */
import client from "./client";

export const getBanks = () => client.get("/withdrawals/banks");

export const resolveBankAccount = ({ account_number, bank_code }) =>
  client.get("/withdrawals/resolve-account", {
    params: { account_number, bank_code },
  });

export const getFeePreview = (amount) =>
  client.get("/withdrawals/fee-preview", { params: { amount } });

export const getMyWithdrawals = () => client.get("/withdrawals/my");

export const requestVendorWithdrawal = (payload) =>
  client.post("/withdrawals/vendor", payload);

export const requestRiderWithdrawal = (payload) =>
  client.post("/withdrawals/rider", payload);

export const getAllWithdrawals = (status) =>
  client.get("/withdrawals/admin/all", { params: status ? { status } : {} });

export const approveWithdrawal = (id) =>
  client.put(`/withdrawals/admin/${id}/approve`);

export const finalizeWithdrawalTransfer = (id, otp) =>
  client.put(`/withdrawals/admin/${id}/finalize`, { otp });

export const rejectWithdrawal = (id, reason) =>
  client.put(`/withdrawals/admin/${id}/reject`, { reason });
