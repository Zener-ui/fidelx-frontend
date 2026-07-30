import client from "./client";

export const getPlatformBalance = () => client.get("/platform-revenue/balance");
export const getPlatformLedger = () => client.get("/platform-revenue/ledger");
export const getPlatformWithdrawals = () => client.get("/platform-revenue/withdrawals");
export const requestPlatformWithdrawal = (payload) => client.post("/platform-revenue/withdrawals", payload);
export const approvePlatformWithdrawal = (id) => client.put(`/platform-revenue/withdrawals/${id}/approve`);
