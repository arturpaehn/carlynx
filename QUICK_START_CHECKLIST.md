# 🚀 Quick Start Checklist

## 1. Run SQL Migration ⚡

```sql
-- Copy this entire file and run in Supabase SQL Editor:
-- supabase/migrations/20250102_add_payment_system.sql
```

**Steps:**
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left menu)
4. Open migration file in VS Code
5. Copy all SQL code
6. Paste in Supabase SQL Editor
7. Click **RUN** (or Ctrl+Enter)
8. Wait for success message

**Expected output:**
```
Payment system migration completed successfully!
Added: payment_status, payment_id, created_by_type to listings
Created: individual_payments table with Stripe integration ready
Created: Indexes, triggers, RLS policies
Ready for: Free trial listings and future Stripe integration
```

## 2. Verify Migration ✅

```sql
-- Run this to check everything is created:
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('payment_status', 'payment_id', 'created_by_type');

-- Should return 3 rows
```

```sql
-- Check individual_payments table exists:
SELECT COUNT(*) FROM individual_payments;

-- Should return 0 (empty table)
```

## 3. Test the Flow 🧪

### Start dev server:
```bash
npm run dev
```

### Test steps:
- [ ] Go to http://localhost:3000
- [ ] Log in as a user
- [ ] Click "Add Listing"
- [ ] Fill in all required fields:
  - [ ] Vehicle type (Car/Motorcycle)
  - [ ] Brand
  - [ ] Model
  - [ ] Year
  - [ ] Price
  - [ ] State
  - [ ] Transmission (for cars)
  - [ ] Upload at least 1 image
- [ ] Click Submit
- [ ] **PaymentConfirmModal should appear** with:
  - [ ] Green banner "🎉 Limited Time Offer - FREE!"
  - [ ] Listing summary (title, vehicle, price, mileage)
  - [ ] Features list (30 days, unlimited views, etc.)
  - [ ] Green button "✓ Add My Listing FREE"
- [ ] Click "✓ Add My Listing FREE"
- [ ] **Agreement modal appears** with Terms & Conditions
- [ ] Check the "I accept" checkbox
- [ ] Click "Agree & Submit"
- [ ] **Should redirect to /my-listings**
- [ ] New listing appears in your listings

## 4. Verify Database Records 🔍

```sql
-- Check payment was created:
SELECT 
  payment_id,
  user_id,
  listing_id,
  payment_status,
  payment_method,
  amount,
  metadata
FROM individual_payments
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- payment_status = 'free_trial'
-- payment_method = 'free_trial'
-- amount = 10.00
-- listing_id = (your listing ID)
```

```sql
-- Check listing was created with payment info:
SELECT 
  id,
  title,
  payment_status,
  payment_id,
  created_by_type,
  is_active
FROM listings
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- payment_status = 'free_trial'
-- payment_id = (UUID matching payment record)
-- created_by_type = 'individual'
-- is_active = true
```

## 5. Check No Errors ✅

### Browser console:
- [ ] No red errors in console
- [ ] No failed network requests
- [ ] Images uploaded successfully

### Supabase logs:
- [ ] Open Supabase Dashboard → Logs
- [ ] Check for any errors in last 5 minutes
- [ ] Should see INSERT into individual_payments
- [ ] Should see INSERT into listings
- [ ] Should see UPDATE on individual_payments

## 6. Edge Cases to Test 🔬

### Individual listing limit:
- [ ] Try to create a 2nd listing while 1st is active
- [ ] Should see error: "You already have an active listing"
- [ ] Deactivate 1st listing
- [ ] Try again - should work

### Missing fields validation:
- [ ] Try to submit without brand → error
- [ ] Try to submit without price → error
- [ ] Try to submit without images → error
- [ ] Try to submit without contact method → error

### Modal cancellation:
- [ ] Click Submit
- [ ] PaymentModal appears
- [ ] Click "Cancel" or X button
- [ ] Modal closes, form still filled
- [ ] Can edit and resubmit

## 7. Translation Check 🌐

### English (EN):
- [ ] Change language to EN in header
- [ ] Submit listing
- [ ] Modal shows "Confirm Your Free Listing"
- [ ] Button says "✓ Add My Listing FREE"
- [ ] Features in English

### Spanish (ES):
- [ ] Change language to ES in header
- [ ] Submit listing
- [ ] Modal shows "Confirme Su Anuncio Gratuito"
- [ ] Button says "✓ Agregar Mi Anuncio GRATIS"
- [ ] Features in Spanish

## 8. Mobile Responsive 📱

- [ ] Open on mobile device or dev tools mobile view
- [ ] PaymentModal renders correctly
- [ ] All buttons clickable
- [ ] Text readable
- [ ] Modal scrollable if needed

## Common Issues & Fixes 🔧

### ❌ Error: "column payment_status does not exist"
**Fix:** Run SQL migration in Supabase

### ❌ Error: "table individual_payments does not exist"
**Fix:** Run SQL migration in Supabase

### ❌ Error: "Payment record creation failed"
**Fix:** Check RLS policies - run `GRANT SELECT, INSERT ON individual_payments TO authenticated;`

### ❌ PaymentModal doesn't appear
**Fix:** Check console for errors, verify import in page.tsx

### ❌ Listing created without payment_id
**Fix:** Check realAddListing() creates payment FIRST, then listing

### ❌ Translation key not found
**Fix:** Check I18nProvider.tsx has new keys in TranslationKey type

## Success Indicators ✨

When everything works:
- ✅ PaymentModal appears with green "FREE" banner
- ✅ Listing details show correctly in modal
- ✅ Can cancel and resubmit
- ✅ Agreement modal appears after payment confirmation
- ✅ Payment record created with payment_status='free_trial'
- ✅ Listing created with payment_id and payment_status='free_trial'
- ✅ Redirect to /my-listings works
- ✅ New listing visible in my-listings
- ✅ Both EN and ES translations work
- ✅ No console errors
- ✅ No Supabase errors

## Performance Check ⚡

```sql
-- Check indexes exist:
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('listings', 'individual_payments')
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Should show:
-- idx_individual_payments_listing_id
-- idx_individual_payments_status
-- idx_individual_payments_stripe_payment_intent
-- idx_individual_payments_user_id
-- idx_listings_created_by_type
-- idx_listings_payment_id
-- idx_listings_payment_status
```

## Security Check 🔒

```sql
-- Check RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'individual_payments';

-- Should show: rowsecurity = true

-- Check policies exist:
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'individual_payments';

-- Should show 2 policies:
-- Users can view their own payments
-- Users can insert their own payments
```

## Ready for Production? 🚀

- [x] SQL migration executed successfully
- [x] Test listing created successfully
- [x] Payment record exists in DB
- [x] Listing linked to payment
- [x] No console errors
- [x] No Supabase errors
- [x] Both languages work
- [x] Mobile responsive
- [x] Individual limit enforced
- [x] RLS policies active
- [x] Indexes created
- [x] All validations work

**If all checked → READY TO DEPLOY! 🎉**

## Next: Stripe Integration (Optional) 💳

When ready to accept real payments:
1. Get Stripe account
2. Install: `npm install @stripe/stripe-js stripe`
3. Add API keys to `.env.local`
4. Change `IS_FREE_TRIAL = false` in PaymentConfirmModal.tsx
5. Add Stripe checkout session logic
6. Test with Stripe test cards
7. Switch to live mode

See: `PAYMENT_SYSTEM_ARCHITECTURE.md` for full Stripe guide

---

**Questions?** Check:
- `PAYMENT_COMPLETE_SUMMARY.md` - Overview
- `PAYMENT_MIGRATION_INSTRUCTIONS.md` - Migration guide
- `PAYMENT_SYSTEM_ARCHITECTURE.md` - Technical details
