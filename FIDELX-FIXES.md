# Fidelx fixes in this package

Included:
- Paystack bank dropdown + server-side account resolution
- Verified account name (not manually editable)
- Vendor/rider withdrawal Paystack transfer initiation
- Transfer webhook success/failure/reversal handling
- Optional Paystack OTP finalization endpoint/UI
- Canonical vendor category dropdown (registration + vendor settings)
- Backend category validation
- Mobile cart/checkout CTA moved above the mobile bottom navigation

Before deploying:
1. Run the backend Supabase migration in `supabase/fidelx_withdrawal_category_migration.sql`.
2. Confirm `PAYSTACK_SECRET_KEY` remains backend-only.
3. Confirm the Paystack webhook points to `/api/payments/webhook`.
4. Test with Paystack test credentials first.
5. Build frontend with `npm run build`.
