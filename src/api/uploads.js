/**
 * UPLOADS API
 * Backend: controllers/uploadController.js
 * Routes: /api/uploads/*
 */
import client from "./client";

export const uploadVoiceNote = (blob) => {
  const formData = new FormData();
  formData.append("audio", blob, "voice-note.webm");
  return client.post("/uploads/voice-note", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadProductImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return client.post("/uploads/product-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadDisputeEvidence = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return client.post("/uploads/dispute-evidence", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadReviewPhotos = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return client.post("/uploads/review-photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
