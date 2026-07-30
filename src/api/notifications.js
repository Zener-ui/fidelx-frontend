import client from "./client";
export const getNotifications = () => client.get("/notifications");
export const markAllRead = () => client.put("/notifications/read-all");
export const markRead = (id) => client.put(`/notifications/${id}/read`);
