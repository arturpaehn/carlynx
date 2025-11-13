# 📊 Dealer Pricing Tiers Update

## New Pricing Structure

Based on number of listings per month:

| Listings | Monthly Price |
|----------|------------|
| Up to 100 | $29 |
| Up to 250 | $49 |
| Up to 500 | $79 |
| Up to 1,000 | $129 |
| 1,000+ (Unlimited) | $199 |

## What Changed

### Before:
- Basic: $400/mo - 50 listings
- Premium: $600/mo - Unlimited
- Enterprise: $800/mo - Unlimited

### After:
- tier_100: $29/mo - 100 listings
- tier_250: $49/mo - 250 listings
- tier_500: $79/mo - 500 listings
- tier_1000: $129/mo - 1,000 listings
- tier_unlimited: $199/mo - Unlimited

## Files Updated

1. ✅ `supabase/migrations/20250103_add_dealers_functionality.sql` - Main migration
2. ✅ `supabase/migrations/20250103_update_dealer_tiers.sql` - **NEW** Update script
3. ✅ `public/locales/en/common.json` - English translations
4. ✅ `public/locales/es/common.json` - Spanish translations
5. ✅ `DEALERS_MIGRATION_GUIDE.md` - Documentation

## How to Apply

### If you already ran the first migration:

Run this in Supabase SQL Editor:

```sql
-- Copy and paste content from:
-- supabase/migrations/20250103_update_dealer_tiers.sql
```

This will:
1. Delete old tiers (basic, premium, enterprise)
2. Add new tiers with correct pricing
3. Update CHECK constraints
4. Migrate any existing dealers to new tier structure

### If you haven't run any migrations yet:

Just run the updated main migration:
```sql
-- Copy and paste content from:
-- supabase/migrations/20250103_add_dealers_functionality.sql
```

## Registration Form

The registration form now shows:
- **EN**: "From $29/month (up to 100 listings)"
- **ES**: "Desde $29/mes (hasta 100 anuncios)"

## Testing

After applying the migration, verify:

```sql
-- Check tiers
SELECT tier_id, tier_name, monthly_price, listing_limit 
FROM subscription_tiers 
ORDER BY COALESCE(listing_limit, 999999);
```

Expected output:
```
tier_100       | Up to 100 listings  | 29.00   | 100
tier_250       | Up to 250 listings  | 49.00   | 250
tier_500       | Up to 500 listings  | 79.00   | 500
tier_1000      | Up to 1000 listings | 129.00  | 1000
tier_unlimited | Unlimited listings  | 199.00  | NULL
```

## Next Steps

1. ✅ Apply migration to database
2. ✅ Test registration form
3. ⏳ Create dealer subscription page with tier selection
4. ⏳ Integrate Stripe for subscription payments
5. ⏳ Add tier upgrade/downgrade functionality

---

**Ready to deploy!** 🚀
