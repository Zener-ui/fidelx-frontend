/**
 * REVIEWS API
 * IMPORTANT: reviews use sub_order_id — NOT order_id
 */
import client from "./client";

// POST /api/reviews
// payload: { sub_order_id, vendor_rating, rider_rating, comment }
// vendor_rating and rider_rating: 1-5
export const createReview = (payload) => client.post("/reviews", payload);

// GET /api/reviews/vendor/:vendorId
// params: { page, limit }
export const getVendorReviews = (vendorId, params) =>
  client.get(`/reviews/vendor/${vendorId}`, { params });
