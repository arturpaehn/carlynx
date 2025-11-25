# DealerCenter Integration - Setup Checklist

## ✅ Completed

- [x] Database migrations applied (3 files)
- [x] CSV feed parser implemented
- [x] Activation page created
- [x] Recurring subscriptions configured
- [x] Email templates created
- [x] Listing limits functions deployed
- [x] Cron jobs scheduled

---

## 🔧 Next Steps - Production Setup

### 1. Environment Variables (CRITICAL)

Добавьте в `.env.local` или Vercel environment variables:

```bash
# DealerCenter API Key (generate secure random string)
DEALERCENTER_API_KEY=dc_live_YOUR_SECURE_API_KEY_HERE_32_CHARS

# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@carlynx.us

# Already configured (verify):
NEXT_PUBLIC_SUPABASE_URL=https://nusnffvsnhmqxoeqjhjs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET_DEALER=whsec_...
NEXT_PUBLIC_SITE_URL=https://carlynx.us
```

**Generate API Key**:
```powershell
# PowerShell command to generate secure 32-char API key
-join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

### 2. Stripe Configuration

#### A. Create Webhook Endpoint (if not exists)
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://carlynx.us/api/dealer/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copy **Signing secret** → Add to env as `STRIPE_WEBHOOK_SECRET_DEALER`

#### B. Verify Subscription Tiers
Check that `subscription_tiers` table has records:
```sql
SELECT id, tier_name, price, max_listings, stripe_price_id 
FROM subscription_tiers 
ORDER BY price;
```

Expected output:
| id | tier_name | price | max_listings | stripe_price_id |
|----|-----------|-------|--------------|-----------------|
| 1  | Tier 1    | 29    | 100          | NULL (auto-creates) |
| 2  | Tier 2    | 49    | 250          | NULL |
| 3  | Tier 3    | 79    | 500          | NULL |
| 4  | Tier 4    | 129   | 1000         | NULL |
| 5  | Tier 5    | 199   | 999999       | NULL |

**Note**: `stripe_price_id` will be auto-created on first dealer activation

---

### 3. Resend Email Setup

#### A. Verify Domain (if not done)
1. Go to: https://resend.com/domains
2. Add domain: `carlynx.us`
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification

#### B. Get API Key
1. Go to: https://resend.com/api-keys
2. Create new API key (Full Access)
3. Copy → Add to env as `RESEND_API_KEY`

#### C. Test Email Sending
```bash
curl -X POST https://carlynx.us/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","type":"welcome"}'
```

---

### 4. Testing Integration

#### A. Create Test CSV File

Create `test_dealercenter_feed.csv`:
```csv
AccountID,DCID,DealerName,Phone,Address,City,State,Zip,StockNumber,Year,Make,Model,Price,Odometer,Transmission,VIN,VehicleDescription,PhotoURLs
TEST001,T001,Test Motors,555-1234,123 Test St,Austin,TX,78701,A001,2020,Honda,Accord,24999,35000,Automatic,1HGCV1F30LA123456,Clean CarFax test vehicle,"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800,https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"
TEST001,T001,Test Motors,555-1234,123 Test St,Austin,TX,78701,A002,2019,Toyota,Camry,22999,42000,Automatic,4T1BF1FK5KU123456,One owner test,"https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800"
```

#### B. Send Test Feed

**Using PowerShell**:
```powershell
$apiKey = "YOUR_DEALERCENTER_API_KEY"
$csvContent = Get-Content "test_dealercenter_feed.csv" -Raw

Invoke-RestMethod -Uri "https://carlynx.us/api/dealercenter/feed/ingest" `
  -Method POST `
  -Headers @{
    "x-api-key" = $apiKey
    "Content-Type" = "text/csv"
  } `
  -Body $csvContent
```

**Using cURL**:
```bash
curl -X POST https://carlynx.us/api/dealercenter/feed/ingest \
  -H "x-api-key: YOUR_DEALERCENTER_API_KEY" \
  -H "Content-Type: text/csv" \
  --data-binary @test_dealercenter_feed.csv
```

#### C. Expected Response
```json
{
  "success": true,
  "dealers_processed": 1,
  "dealers_created": 1,
  "listings_inserted": 2,
  "listings_updated": 0,
  "total_rows": 2
}
```

#### D. Verify in Database
```sql
-- Check dealer created
SELECT * FROM dealercenter_dealers 
WHERE dealercenter_account_id = 'TEST001';

-- Check listings imported
SELECT external_id, title, year, brand, model, price, is_active
FROM external_listings 
WHERE source = 'dealercenter' 
  AND external_id LIKE 'DC-%TEST001%';
```

#### E. Test Activation Flow
1. Get activation token from database:
   ```sql
   SELECT activation_token FROM dealercenter_dealers 
   WHERE dealercenter_account_id = 'TEST001';
   ```
2. Open: `https://carlynx.us/dealers/activate/{token}`
3. Should see 5 tier options
4. Click tier → Redirects to Stripe Checkout
5. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
6. Complete payment
7. Verify subscription active:
   ```sql
   SELECT subscription_status, stripe_subscription_id, activation_date
   FROM dealercenter_dealers 
   WHERE dealercenter_account_id = 'TEST001';
   ```

---

### 5. Verify Cron Jobs Running

Check Supabase logs for cron execution:

```sql
-- View scheduled cron jobs
SELECT * FROM cron.job 
WHERE jobname LIKE '%dealercenter%';

-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname LIKE '%dealercenter%'
)
ORDER BY start_time DESC 
LIMIT 10;
```

**Expected jobs**:
- `enforce-dealercenter-listing-limits` (every 6 hours)
- `expire-dealercenter-subscriptions` (daily 2 AM)
- `deactivate-expired-dealer-listings` (daily 2:15 AM)
- `check-expiring-dealercenter-subscriptions` (daily 10 AM)

---

### 6. Monitor & Debug

#### A. Check API Logs
```bash
# Vercel logs
vercel logs --follow

# Or in Vercel dashboard
https://vercel.com/your-project/logs
```

#### B. Test Listing Limits Function
```sql
-- Manually trigger listing limits check
SELECT * FROM check_dealercenter_listing_limits();

-- Should return dealers with excess listings
```

#### C. Test Email Templates (Manual)
```typescript
// Create test endpoint: /api/test-email/route.ts
import { sendWelcomeEmail } from '@/lib/emailService'

export async function POST(req) {
  const { to, type } = await req.json()
  
  if (type === 'welcome') {
    await sendWelcomeEmail(to, {
      dealer_name: 'Test Motors',
      activation_token: 'test123token',
      free_listings: 5
    })
  }
  
  return Response.json({ success: true })
}
```

---

### 7. Send to DealerCenter

Once testing passes, send them:

#### Email Template:
```
Subject: CarLynx DealerCenter Integration - Ready for Production

Hi DealerCenter Team,

Great news! The CarLynx integration is fully implemented and tested. 

🎉 AUTOMATIC DEALER ONBOARDING - No manual registration needed!

Key Features:
✅ CSV feed ingestion (POST endpoint ready)
✅ Automatic dealer registration from first feed
✅ 5 free listings trial
✅ Recurring monthly subscriptions ($29-199)
✅ Email notifications (welcome, payment failed, expiring)
✅ Automatic listing limits enforcement
✅ FTP/SFTP coming in 7 days

API CREDENTIALS:
• Endpoint: https://carlynx.us/api/dealercenter/feed/ingest
• Method: POST
• Content-Type: text/csv
• Header: x-api-key: [PROVIDED_SEPARATELY]

I've attached:
1. Complete API documentation (DEALERCENTER_INTEGRATION_INFO.md)
2. Answers to all 16 questions (DEALERCENTER_RESPONSE_LETTER.md)
3. Sample CSV file
4. Test credentials

Ready to start integration testing whenever you are!

Best regards,
Artur
CarLynx Technical Team
support@carlynx.us
```

#### Attachments:
- `DEALERCENTER_INTEGRATION_INFO.md`
- `DEALERCENTER_RESPONSE_LETTER.md`
- `test_dealercenter_feed.csv` (sample)
- API Key (send separately for security)

---

## 🔒 Security Checklist

- [ ] `DEALERCENTER_API_KEY` is strong (32+ chars)
- [ ] API key NOT committed to Git
- [ ] Stripe webhook secret configured
- [ ] Resend API key secured
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting considered (currently unlimited)
- [ ] Email domain verified in Resend
- [ ] Test credit card removed after testing

---

## 📊 Success Metrics to Track

After go-live, monitor:

1. **Dealers onboarded** per week
2. **Free trial → Paid conversion rate**
3. **Average listings per dealer**
4. **Subscription churn rate**
5. **Email delivery rates** (Resend dashboard)
6. **API response times** (Vercel analytics)
7. **Failed payments** (Stripe dashboard)

---

## 🐛 Troubleshooting

### Problem: CSV upload returns 401 Unauthorized
**Solution**: Check `x-api-key` header matches `DEALERCENTER_API_KEY` env var

### Problem: Dealer created but no welcome email
**Solution**: 
1. Check Resend API key configured
2. Check email domain verified
3. View Resend logs: https://resend.com/emails
4. Check dealer has `contact_email` or use DealerCenter's email

### Problem: Stripe webhook not triggering
**Solution**:
1. Verify webhook URL: `https://carlynx.us/api/dealer/webhooks/stripe`
2. Check signing secret matches env var
3. Test webhook in Stripe dashboard
4. Check Vercel function logs

### Problem: Listings not showing on site
**Solution**:
1. Check `is_active = true` in database
2. Verify `state_id` and `city_id` matched correctly
3. Check dealer subscription status is `active` or `pending`
4. Run listing limits function manually

### Problem: Cron jobs not running
**Solution**:
1. Verify pg_cron extension enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Check cron schedule: `SELECT * FROM cron.job;`
3. View errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
4. Restart Supabase instance if needed

---

## 📞 Next Actions

**IMMEDIATE** (Today):
1. ✅ Add environment variables to Vercel
2. ✅ Generate and save API key securely
3. ✅ Test CSV upload with sample data
4. ✅ Verify Stripe webhook configured

**THIS WEEK** (1-3 days):
5. ✅ Complete end-to-end testing
6. ✅ Send integration docs to DealerCenter
7. ✅ Schedule demo/walkthrough call

**NEXT WEEK** (7-10 days):
8. 🔄 Implement FTP/SFTP upload (if needed)
9. 🔄 Build dealer dashboard UI
10. 🔄 Add advanced analytics

---

**Status**: Ready for Production Testing 🚀
**Last Updated**: November 25, 2025
