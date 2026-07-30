/**
 * WITHDRAWALS API
 * Backend: controllers/withdrawalController.js
 * Routes:  /api/withdrawals/*
 */
import client from "./client";

// GET /api/withdrawals/fee-preview?amount=N
// response: { success, breakdown: { gross_amount, withdrawal_fee, net_payout, fee_percentage, fee_was_capped } }
export const getFeePreview = (amount) =>
  client.get("/withdrawals/fee-preview", { params: { amount } });

// GET /api/withdrawals/my
// response: { success, withdrawals[] }
export const getMyWithdrawals = () => client.get("/withdrawals/my");

// POST /api/withdrawals/vendor  [vendor]
// payload: { amount, bank_account, bank_name, account_name }
export const requestVendorWithdrawal = (payload) =>
  client.post("/withdrawals/vendor", payload);

// POST /api/withdrawals/rider  [rider]
// payload: { amount, bank_account, bank_name, account_name }
export const requestRiderWithdrawal = (payload) =>
  client.post("/withdrawals/rider", payload);

// Admin
export const getAllWithdrawals = (status) =>
  client.get("/withdrawals/admin/all", { params: status ? { status } : {} });

export const approveWithdrawal = (id, proof_of_payout) =>
  client.put(`/withdrawals/admin/${id}/approve`, { proof_of_payout });

export const rejectWithdrawal = (id, reason) =>
  client.put(`/withdrawals/admin/${id}/reject`, { reason });
