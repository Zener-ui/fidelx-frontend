import client from "./client";

// Analytics
export const getAnalytics = () => client.get("/admin/analytics");

// Vendors
export const getAdminVendors = (status) =>
  client.get("/admin/vendors", { params: status ? { status } : {} });
export const approveVendor = (id) => client.put(`/admin/vendors/${id}/approve`);
export const rejectVendor = (id, reason) =>
  client.put(`/admin/vendors/${id}/reject`, { reason });

// Riders
export const getAdminRiders = (status) =>
  client.get("/admin/riders", { params: status ? { status } : {} });
export const approveRider = (id, payload = {}) =>
  client.put(`/admin/riders/${id}/approve`, payload);
export const rejectRider = (id, reason) =>
  client.put(`/admin/riders/${id}/reject`, { reason });
export const strikeRider = (id) => client.put(`/admin/riders/${id}/strike`);

// Orders + Disputes
export const getAdminOrders = (status) =>
  client.get("/admin/orders", { params: status ? { status } : {} });
export const getAdminDisputes = () => client.get("/admin/disputes");
export const resolveDispute = (id, payload) =>
  client.put(`/admin/disputes/${id}/resolve`, payload);

// Support
export const getAdminTickets = () => client.get("/admin/support-tickets");
export const replyToAdminTicket = (id, message) =>
  client.put(`/admin/support-tickets/${id}/reply`, { message });

// Monitoring
export const getAlerts = (params) => client.get("/monitoring/alerts", { params });
export const resolveAlert = (id) => client.put(`/monitoring/alerts/${id}/resolve`);
export const getStuckOrders = () => client.get("/monitoring/stuck-orders");
export const getFailedWebhooks = () => client.get("/monitoring/failed-webhooks");

// Pilot
export const getPilotSettings = () => client.get("/pilot/settings");
export const updatePilotSettings = (payload) =>
  client.put("/pilot/admin/settings", payload);
export const generateInviteCode = (payload) =>
  client.post("/pilot/admin/invite-codes/generate", payload);

// Review moderation
export const getAllReviewsAdmin = (flagged) =>
  client.get("/admin/reviews", { params: flagged ? { flagged: "true" } : {} });
export const flagReview = (id) => client.put(`/admin/reviews/${id}/flag`);
export const removeReview = (id, reason) => client.put(`/admin/reviews/${id}/remove`, { reason });
export const restoreReview = (id) => client.put(`/admin/reviews/${id}/restore`);
