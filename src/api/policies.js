/**
 * POLICIES API
 * Backend: controllers/pilotAndOpsController.js
 * Routes:  /api/policies/*
 */
import client from "./client";

// GET /api/policies/:type  [public]
// response: { success, policy: { id, type, title, content, version, ... } }
export const getPolicyByType = (type) => client.get(`/policies/${type}`);

// POST /api/policies/accept  [authenticated]
// payload: { policy_id, policy_version }
export const acceptPolicy = (payload) => client.post("/policies/accept", payload);
