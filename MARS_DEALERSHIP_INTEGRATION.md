# Mars Dealership Integration - Complete Guide

## 📋 Overview
Automatic daily sync of vehicle listings from marsdealership.com into CarLynx database. External listings appear in search results alongside regular listings with a "Partner" badge.

## 🗄️ Database Structure

### Table: `external_listings`
Located in: `supabase/migrations/20250108_create_external_listings.sql`

**Fields:**
- `id` (uuid) - Primary key
- `external_id` (text) - Unique ID from source website
- `source` (text) - Default: 'mars_dealership'
- `external_url` (text) - Link to original listing
- `title`, `model`, `year`, `price`, `transmission`, `mileage`, `fuel_type`, `vehicle_type`
- `image_url` - Main photo uploaded to Supabase Storage
- `contact_phone` - Default: '+1 682 360 3867'
- `contact_email` - Default: 'marsdealership@gmail.com'
- `state_id` (FK to states) - Texas (ID: 1)
- `city_id` (FK to cities) - Dallas (ID: 3)
- `city_name` - 'Dallas'
- `is_active`, `last_seen_at`, `created_at`, `updated_at`

**Indexes:**
- external_id, source, is_active, last_seen_at, state_id

**Storage Bucket:** `external-listing-images` (public)

## 🤖 Parser Script

### Location
`scripts/parsers/marsDealershipParser.ts`

### Features
✅ Pagination - Fetches all 4 pages (44+ listings)
✅ HTML parsing with Cheerio
✅ Extracts: title, model, year, price, transmission, mileage
✅ Downloads main photo → uploads to Supabase Storage
✅ Location: Dallas, TX (state_id: 1, city_id: 3)
✅ Deactivates removed listings automatically
✅ Polite scraping (500ms delay between pages)

### Data Extraction
```typescript
- Title: h2.listing-title a
- Price: .listing-price .price-text
- Year: Extracted from title (regex: /\b(19|20)\d{2}\b/)
- Model: From title after year
- Mileage: .listing-meta.with-icon .value-suffix
- Transmission: .listing-meta.transmission
- Image: .listing-image img (src/data-src)
```

### Manual Run
```bash
npx tsx scripts/parsers/marsDealershipParser.ts
```

## ⏰ Automated Sync

### Vercel Cron Job
**File:** `src/app/api/cron/sync-mars-dealership/route.ts`

**Schedule:** Daily at **5 PM Estonian Time (14:00 UTC)**

**Configuration:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-mars-dealership",
      "schedule": "0 14 * * *"
    }
  ]
}
```

### Environment Variables Required

⚠️ **CRITICAL:** Add these to Vercel Dashboard (Production environment):

1. **CRON_SECRET** - Generate with hex (not base64):
   ```bash
   # PowerShell (Windows):
   $bytes = New-Object byte[] 32 ; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes) ; -join ($bytes | ForEach-Object { $_.ToString("x2") })
   
   # Linux/Mac:
   openssl rand -hex 32
   ```
   
   ⚠️ **Important:** Use hex format (no `+` or `=` symbols) to avoid HTTP header issues!

2. **NEXT_PUBLIC_SUPABASE_URL**
   ```
   https://your-project.supabase.co
   ```

3. **SUPABASE_SERVICE_ROLE_KEY** (⚠️ NOT anon key!)
   ```
   eyJhbGci... (long JWT token starting with eyJ)
   ```
   
   Get from: Supabase Dashboard → Settings → API → service_role key

### Authentication Method

**Custom Header:** `x-cron-secret`

Why not `Authorization` header? Vercel proxy filters `Authorization` headers, so we use custom header instead.

**API Endpoint Protection:**
```typescript
const cronSecret = request.headers.get('x-cron-secret');
if (cronSecret !== CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Manual Trigger

PowerShell:
```powershell
Invoke-RestMethod -Uri "https://carlynx.us/api/cron/sync-mars-dealership" -Method Get -Headers @{"x-cron-secret"="YOUR_SECRET_HERE"}
```

Bash/curl:
```bash
curl -H "x-cron-secret: YOUR_SECRET_HERE" https://carlynx.us/api/cron/sync-mars-dealership
```

## 🔍 Frontend Integration

### Homepage (`src/app/page.tsx`)
- Fetches both `listings` and `external_listings`
- Combines results (limit: 12 total)
- Shows "Partner" badge on external listings
- External listings open in new tab

### Search Results (`src/app/search-results/page.tsx`)
- Queries both tables with same filters
- Combines and sorts results
- Pagination applied to combined results
- "Partner" badge displayed
- External listings link to `external_url`

### Partner Badge
```tsx
<span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center">
  <svg>...</svg>
  Partner
</span>
```

## 📊 Testing

### Check Database
```bash
npx tsx scripts/check-external-listings.ts
```

Shows: Total count, latest 10 listings with all fields

### Check Location Data
```bash
npx tsx scripts/check-location.ts
```

Verifies: State (Texas), City (Dallas) are correctly stored

## 🚀 Deployment Checklist

### 1. Database Setup
- ✅ Apply migration: `supabase/migrations/20250108_create_external_listings.sql`
- ✅ Verify `external_listings` table exists
- ✅ Verify `external-listing-images` storage bucket created

### 2. Local Testing
```bash
npx tsx scripts/parsers/marsDealershipParser.ts
```
Expected output: "✅ Synced 44 listings"

### 3. Code Deployment
```bash
git add .
git commit -m "Add Mars Dealership integration"
git push origin main
```
Vercel auto-deploys from GitHub

### 4. Vercel Environment Variables Setup

⚠️ **Common Issues & Solutions:**

**Problem:** `supabaseKey is required` error
**Solution:** Ensure ALL these variables exist in Vercel with **Production** environment:

Go to: https://vercel.com/[your-team]/carlynx/settings/environment-variables

Add these **3 variables**:

| Variable Name | Value | Environment | Notes |
|--------------|-------|-------------|-------|
| `CRON_SECRET` | hex string (64 chars) | Production | Use hex generator (see above) |
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | Production | From Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... | Production | **service_role** key (NOT anon!) |

**Problem:** Variables added but still not working
**Solution:** After adding variables, you MUST redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```
OR click "Redeploy" in Vercel Dashboard (without build cache)

**Problem:** `Authorization` header not working (401 Unauthorized)
**Solution:** We use `x-cron-secret` header instead due to Vercel proxy filtering

### 5. Test Cron Endpoint Manually

```powershell
# Replace YOUR_SECRET with actual CRON_SECRET value
Invoke-RestMethod -Uri "https://carlynx.us/api/cron/sync-mars-dealership" -Method Get -Headers @{"x-cron-secret"="YOUR_SECRET"}
```

Expected response:
```json
{
  "success": true,
  "message": "Mars Dealership sync completed",
  "timestamp": "2025-10-09T12:19:53.974Z"
}
```

Expected duration: 30-60 seconds

### 6. Verify on Live Site
- ✅ Open https://carlynx.us/
- ✅ See listings with ⭐ **Partner** badge
- ✅ Count increased by ~44 listings
- ✅ Click Partner listing → opens marsdealership.com in new tab
- ✅ Footer shows correct total count (includes external listings)
- ✅ Search filters work with external listings

## 📝 Key Implementation Details

### Why Pagination?
Mars Dealership has 44 listings across 4 pages. Parser automatically detects and fetches all pages until 404.

### Why Dallas, TX?
All Mars Dealership vehicles are located in:
- **State:** Texas (ID: 1)
- **City:** Dallas (ID: 3)
- **Contact:** +1 682 360 3867, marsdealership@gmail.com

### Deactivation Logic
Listings not seen during sync (`last_seen_at < current_sync_time`) are automatically set to `is_active = false`. No grace period.

### Image Handling
- Only main photo is downloaded
- Uploaded to `external-listing-images` bucket
- Filename: `{external_id}-{timestamp}.jpg`
- Public access enabled

### Lazy Initialization Pattern

⚠️ **Important:** Supabase/Stripe clients must use lazy initialization to avoid build-time errors:

**❌ Wrong (causes "supabaseKey is required" at build time):**
```typescript
const supabase = createClient(url, key); // Runs at import time

export function myFunction() {
  supabase.from('table')... // Uses pre-initialized client
}
```

**✅ Correct (initialization happens at runtime):**
```typescript
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function myFunction() {
  const supabase = getSupabase(); // Creates client when needed
  supabase.from('table')...
}
```

This pattern is used in:
- `scripts/parsers/marsDealershipParser.ts`
- `src/app/api/dealer/**/*.ts`
- `src/app/api/cron/sync-mars-dealership/route.ts`

### Explicit Credentials Passing

Parser receives credentials explicitly from API endpoint to ensure environment variables are accessible:

```typescript
// API endpoint passes credentials
await syncMarsDealer(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parser accepts optional credentials
export async function syncMarsDealer(url?: string, key?: string) {
  const supabase = getSupabase(url, key); // Uses passed values or falls back to env
  // ...
}
```

## 🔧 Maintenance

### Monitor Sync

**Check Logs in Vercel:**
1. Go to: https://vercel.com/[your-team]/carlynx/deployments
2. Click latest deployment
3. Click "Logs" tab → "Runtime Logs"
4. Search for: `/api/cron/sync-mars-dealership`

**What to look for:**
- ✅ Execution time: 30-90 seconds (normal)
- ✅ Status: 200 OK
- ✅ Console logs: "🎉 Sync complete! Processed X listings"
- ❌ Status: 500 → Check error message
- ❌ Status: 401 → CRON_SECRET mismatch
- ❌ "supabaseKey is required" → Environment variables missing

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Wrong/missing CRON_SECRET | Regenerate secret, update Vercel variable |
| `500: supabaseKey is required` | Missing SUPABASE_SERVICE_ROLE_KEY | Add to Vercel, redeploy |
| `500: Supabase credentials missing: url=true, key=false` | SERVICE_ROLE_KEY not in Production | Check environment checkbox, redeploy |
| Timeout (>300s) | Mars Dealership slow/down | Increase `maxDuration` in route.ts |
| `404: listings not found` | Mars Dealership changed URL | Update `BASE_URL` in parser |

### Update Parser
If Mars Dealership changes HTML structure:
1. Run `npx tsx scripts/inspect-html.ts` to analyze new structure
2. Update selectors in `marsDealershipParser.ts`
3. Test locally: `npx tsx scripts/parsers/marsDealershipParser.ts`
4. Deploy and test on production

### Add New Source
To add another dealership:
1. Create new parser in `scripts/parsers/` (copy `marsDealershipParser.ts` as template)
2. Use same `external_listings` table (change `source` field value)
3. Add new cron job in `vercel.json`:
   ```json
   {
     "path": "/api/cron/sync-new-dealer",
     "schedule": "0 15 * * *"
   }
   ```
4. Create API route: `src/app/api/cron/sync-new-dealer/route.ts`
5. Update frontend filters if needed (e.g., filter by source)

## 📦 Dependencies
- `cheerio` - HTML parsing
- `dotenv` - Environment variables (local testing)
- `@supabase/supabase-js` - Database & Storage

## ✅ Success Metrics
- ✅ 44 listings synced from Mars Dealership
- ✅ All fields populated (title, year, price, model, transmission, mileage)
- ✅ Dallas, TX location correctly stored
- ✅ Photos uploaded to Storage
- ✅ Appears in homepage (latest listings)
- ✅ Appears in search results with filters
- ✅ Partner badge visible
- ✅ Links to external site work

## 🎯 Future Enhancements
- [ ] Add more dealership sources
- [ ] Email notifications for sync failures
- [ ] Analytics: track click-through rate on Partner listings
- [ ] Admin dashboard to manage external sources
- [ ] Support for multiple photos per listing
