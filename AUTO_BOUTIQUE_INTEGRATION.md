# Auto Boutique Texas Integration

## Overview
Автоматическая интеграция с Auto Boutique Texas для синхронизации их инвентаря с нашей платформой.

## Dealer Information
- **Name**: Auto Boutique Texas
- **Location**: Houston, TX (3507 FM 528 Road, Alvin, TX 77511)
- **Phone**: (713) 352-0777
- **Email**: info@autoboutiquetexas.com
- **Website**: https://www.autoboutiquetexas.com
- **Inventory URL**: https://www.autoboutiquetexas.com/used-vehicles-houston-tx

## Technical Details

### Listings Pages
- **Base URL**: https://www.autoboutiquetexas.com/used-vehicles-houston-tx
- **Pagination**: /page/2, /page/3, ... /page/25
- **Total Pages**: 25
- **Listings per page**: ~25
- **Total Inventory**: ~603 vehicles

### Data Extraction
Parser extracts the following information:
- Title (Year Make Model Trim)
- Year (2017-2023)
- Make & Model (Toyota, Ford, BMW, Tesla, etc.)
- Price ($11,500 - $29,900)
- Mileage (31,985 - 120,298 miles)
- Fuel Type (gasoline, electric, hybrid, diesel)
- Vehicle Type (car, truck, suv)
- Images (vehicle photos)
- External URL (link to detail page)

### Sync Schedule
- **Frequency**: Daily at 14:00 UTC (5 PM Estonian Time)
- **Cron Expression**: `0 14 * * *`
- **Endpoint**: `/api/cron/sync-mars-dealership` (handles both dealers)
- **Max Duration**: 300 seconds (5 minutes)

## Database Schema

### External Listings Table
All Auto Boutique Texas listings are stored in the `external_listings` table:

```sql
external_id VARCHAR(255) -- Unique ID from URL (e.g., "used-2021-toyota-corolla-le-5yfepmae8mp214314")
source VARCHAR(50) -- 'auto_boutique_texas'
external_url TEXT -- Full URL to listing detail page
title VARCHAR(255) -- e.g., "2021 Toyota Corolla LE"
model VARCHAR(100) -- e.g., "Toyota Corolla"
year INTEGER -- e.g., 2021
price DECIMAL(10,2) -- e.g., 15200.00
transmission VARCHAR(50) -- 'automatic' (default)
mileage INTEGER -- e.g., 77721
fuel_type VARCHAR(50) -- 'gasoline', 'electric', 'hybrid', 'diesel'
vehicle_type VARCHAR(50) -- 'car', 'truck', 'suv'
image_url TEXT -- Uploaded to Supabase Storage
contact_phone VARCHAR(50) -- '(713) 352-0777'
contact_email VARCHAR(100) -- 'info@autoboutiquetexas.com'
state_id INTEGER -- Foreign key to states table (Texas)
city_id INTEGER -- Foreign key to cities table (Houston)
city_name VARCHAR(100) -- 'Houston'
last_seen_at TIMESTAMP -- Last time listing was found during sync
is_active BOOLEAN -- true if still available
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Files Structure

### Parser
```
scripts/parsers/autoBoutiqueParser.ts
```
Main scraping logic:
- `fetchListings()` - Fetches and parses all 25 pages
- `downloadAndUploadImage()` - Downloads and stores images in Supabase Storage
- `getLocationIds()` - Gets Texas/Houston IDs from database
- `syncListings()` - Syncs scraped data to database
- `syncAutoBoutique()` - Main entry point

### API Endpoint
```
src/app/api/cron/sync-mars-dealership/route.ts
```
Cron job endpoint that runs both Mars Dealership and Auto Boutique Texas syncs.

### Configuration
```
vercel.json
```
Defines cron schedule for automatic sync.

## How It Works

### 1. Scheduled Execution
Every day at 14:00 UTC (5 PM Estonian Time):
1. Vercel Cron triggers `/api/cron/sync-mars-dealership`
2. Endpoint verifies `x-cron-secret` header
3. Calls `syncAutoBoutique()` function

### 2. Data Scraping
1. Loop through pages 1-25
2. Parse HTML with Cheerio
3. Extract vehicle data from each listing card
4. Extract from URL format: `used-{year}-{make}-{model}-{trim}-{vin}`
5. Stop if page returns 404 or has no listings

### 3. Image Processing
1. Download original image from Auto Boutique Texas
2. Upload to Supabase Storage bucket `external-listing-images`
3. Store public URL in database

### 4. Database Sync
1. Check if listing exists (by `external_id` + `source`)
2. If exists: UPDATE with latest data
3. If new: INSERT new record
4. Set `last_seen_at` to current timestamp
5. After sync: Deactivate listings not seen (`last_seen_at < current time`)

### 5. Display on Website
- Homepage: Shows mixed latest listings (ours + Auto Boutique + Mars)
- Search: Includes Auto Boutique listings with "Partner" badge
- Detail page: Opens at `/listing/ext-{id}` with dealer info

## Testing

### Manual Test
```bash
# Run parser locally
cd scripts/parsers
npx ts-node autoBoutiqueParser.ts
```

### Test Cron Endpoint
```bash
curl -X GET https://carlynx.vercel.app/api/cron/sync-mars-dealership \
  -H "x-cron-secret: YOUR_SECRET_HERE"
```

### Expected Output
```json
{
  "success": true,
  "message": "All syncs completed successfully",
  "results": {
    "marsDealer": {
      "success": true,
      "error": null,
      "count": 0
    },
    "autoBoutique": {
      "success": true,
      "error": null,
      "count": 0
    }
  },
  "timestamp": "2025-01-10T14:00:00.000Z"
}
```

## Monitoring

### Logs
Check Vercel deployment logs:
1. Go to Vercel Dashboard
2. Select project
3. Go to "Deployments" → "Functions"
4. Find `/api/cron/sync-mars-dealership` function
5. View logs for execution details

### Success Indicators
- ✅ `Starting Auto Boutique Texas sync...`
- ✅ `Found X listings on page Y`
- ✅ `Total listings found: ~603`
- ✅ `Created/Updated listing: ...`
- ✅ `Auto Boutique Texas sync completed successfully!`

### Error Indicators
- ❌ `Page X returned status 404`
- ❌ `Error fetching page X`
- ❌ `Error parsing listing`
- ❌ `Error uploading image`
- ❌ `Fatal error during sync`

## Troubleshooting

### No Listings Found
**Problem**: Parser returns 0 listings

**Solutions**:
1. Check if website structure changed
2. Verify URL is accessible: `curl https://www.autoboutiquetexas.com/used-vehicles-houston-tx`
3. Check Cheerio selectors still match HTML structure
4. Test locally with `npx ts-node autoBoutiqueParser.ts`

### Images Not Uploading
**Problem**: `image_url` is null in database

**Solutions**:
1. Check Supabase Storage bucket `external-listing-images` exists
2. Verify bucket is PUBLIC
3. Check `SUPABASE_SERVICE_ROLE_KEY` has storage permissions
4. Test image URL manually: `curl [IMAGE_URL]`

### Cron Not Running
**Problem**: Sync doesn't happen at scheduled time

**Solutions**:
1. Check `vercel.json` cron configuration
2. Verify `CRON_SECRET` environment variable is set
3. Check Vercel deployment includes `vercel.json`
4. View Vercel Cron logs in dashboard

### Duplicate Listings
**Problem**: Same listing appears multiple times

**Solutions**:
1. Check `external_id` extraction logic
2. Verify unique constraint on `(external_id, source)`
3. Ensure parser skips already-seen listings on same page

## Environment Variables

Required in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CRON_SECRET=1c1c602eb6ed92b2be414269b77a0a936096dad2500b81663283ab595fe0ae5e
```

## Performance

### Sync Duration
- Expected: 60-120 seconds for 603 listings across 25 pages
- Max allowed: 300 seconds (Vercel function timeout)

### Rate Limiting
- Delay between page requests: 1000ms (1 second)
- Total requests: ~25 pages + ~603 listings = ~628 requests
- Total time: ~25 seconds for pages + image uploads

## Future Improvements

1. **Incremental Sync**: Only fetch updated listings
2. **Image Optimization**: Resize/compress before upload
3. **Parallel Processing**: Fetch multiple pages simultaneously
4. **Webhook Integration**: Real-time updates when inventory changes
5. **Detailed Specs**: Parse transmission, engine, color from detail pages
6. **Multiple Images**: Store all listing photos (not just first)

## Contact

For issues or questions about Auto Boutique Texas integration:
- Check logs in Vercel Dashboard
- Review this documentation
- Test parser locally
- Contact Auto Boutique Texas: (713) 352-0777
