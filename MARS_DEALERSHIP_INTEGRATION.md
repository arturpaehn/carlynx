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

### Environment Variables
Add to Vercel Dashboard:
```
CRON_SECRET=<your-random-secret-here>
```

Generate secret:
```bash
openssl rand -base64 32
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

1. ✅ Apply database migration to Supabase
2. ✅ Test parser locally: `npx tsx scripts/parsers/marsDealershipParser.ts`
3. ✅ Commit code changes
4. ✅ Push to GitHub → Vercel auto-deploys
5. ✅ Add `CRON_SECRET` to Vercel Environment Variables
6. ✅ Verify cron job in Vercel Dashboard
7. ✅ Test search functionality on live site

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

## 🔧 Maintenance

### Monitor Sync
Check Vercel Cron Logs for:
- Execution time (should be < 5 min)
- Number of listings processed
- Any errors

### Update Parser
If Mars Dealership changes HTML structure:
1. Run `npx tsx scripts/inspect-html.ts` to analyze new structure
2. Update selectors in `marsDealershipParser.ts`
3. Test locally before deploying

### Add New Source
To add another dealership:
1. Create new parser in `scripts/parsers/`
2. Use same `external_listings` table (change `source` field)
3. Add new cron job in `vercel.json`
4. Update frontend filters if needed

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
