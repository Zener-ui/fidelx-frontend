/**
 * DELIVERY API
 * Backend: controllers/deliveryController.js
 * Routes:  /api/delivery/*
 */
import client from "./client";

// GET /api/delivery/estimate
// params: { vendor_id, delivery_lat, delivery_lng, is_large_package?, is_rush? }
// response: {
//   success,
//   estimate: {
//     delivery_fee, delivery_margin, rider_payout,
//     distance_km,
//     breakdown: { base_fee, distance_component, fuel_multiplier, peak_applied, rain_applied, ... }
//   }
// }
export const estimateDelivery = (params) =>
  client.get("/delivery/estimate", { params });
