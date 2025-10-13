# Pre-owned Plus Integration Guide

## Overview
This document describes the integration with **Pre-owned Plus** (San Antonio, TX) automated inventory sync.

## Dealer Information
- **Company Name**: Pre-owned Plus
- **Location**: San Antonio, Texas
- **Website**: https://www.preownedplus.com
- **Inventory URL**: https://www.preownedplus.com/inventory
- **Phone**: (210) 951-5575
- **Email**: None (not displayed)
- **Source ID**: `preowned_plus`

## Parser Implementation

### File Location
`scripts/parsers/preOwnedPlusParser.ts`

### Key Features
1. ✅ **Pagination Handling**: Auto-detects pages until no listings found (max 20 pages)
2. ✅ **Price Filtering**: Skips listings without price (learned from previous parsers)
3. ✅ **Image Processing**: Downloads and uploads to Supabase Storage
4. ✅ **VIN Extraction**: Extracts VIN from Carfax links
5. ✅ **Duplicate Prevention**: Updates existing listings instead of duplicating
6. ✅ **Deactivation**: Automatically marks removed listings as inactive

### Data Extraction
- **Title**: Vehicle year, make, model, trim
- **Price**: Internet Price
- **Mileage**: From "Mileage:" field
- **Stock Number**: From "Stock#:" field
- **Images**: First available image
- **VIN**: From Carfax link URL parameter

### Location Data
- **State**: Texas (TX)
- **City**: San Antonio
- **State ID**: Automatically fetched from database
- **City ID**: Automatically fetched from database (or null)

## Running the Parser

### Local Testing (Development Database)
```bash
node -r dotenv/config scripts/parsers/dist/preOwnedPlusParser.js dotenv_config_path=.env.local
```

### Production Run
```bash
node -r dotenv/config scripts/parsers/dist/preOwnedPlusParser.js dotenv_config_path=.env.production
```

### Via Cron Job
The parser runs automatically daily at **14:00 UTC** via Vercel Cron Job endpoint:
`/api/cron/sync-mars-dealership`

## Database Schema

### Table: `external_listings`
```sql
source = 'preowned_plus'
external_url = 'https://www.preownedplus.com/VehicleDetails/...'
title = 'Year Make Model Trim'
year = 2020
make = 'Honda'
model = 'Accord Sedan'
price = 15999
mileage = 45000
state_id = [Texas ID]
city_id = [San Antonio ID or null]
city_name = 'San Antonio'
image_url = 'https://kjntriyhqpfxqciaxbpj.supabase.co/storage/v1/object/public/external-listing-images/preowned_plus/...'
contact_phone = '(210) 951-5575'
contact_email = null
vehicle_type = 'car'
vin = '17-character VIN'
is_active = true
last_seen_at = '2025-01-11T14:00:00Z'
```

## Frontend Display

### Company Name
In `src/app/listing/[id]/page.tsx`, the company name is determined by source:
```typescript
if (externalData.source === 'mars_dealership') {
  companyName = 'Mars Dealership LLC';
} else if (externalData.source === 'auto_boutique_texas') {
  companyName = 'Auto Boutique Texas';
} else if (externalData.source === 'preowned_plus') {
  companyName = 'Pre-owned Plus';
}
```

### Partner Badge
Pre-owned Plus listings **do NOT** show the "Partner" badge. Only `mars_dealership` shows the badge:
```typescript
{item.is_external && item.external_source === 'mars_dealership' && (
  <div className="...">Partner</div>
)}
```

### Contact Information
- **Phone**: (210) 951-5575 (displayed)
- **Email**: null (not displayed)

## Cron Job Configuration

### vercel.json
```json
{
  "crons": [{
    "path": "/api/cron/sync-mars-dealership",
    "schedule": "0 14 * * *"
  }]
}
```

### API Endpoint
`src/app/api/cron/sync-mars-dealership/route.ts`

The endpoint syncs **all three dealers**:
1. Mars Dealership (Dallas, TX)
2. Auto Boutique Texas (Houston, TX)
3. Pre-owned Plus (San Antonio, TX)

Returns HTTP 207 (Multi-Status) if some syncs fail, 200 if all succeed.

## Error Handling

### Common Issues
1. **No price found**: Listing is skipped (not inserted)
2. **Image download fails**: Listing inserted without image
3. **Location not found**: Uses null for city_id
4. **Duplicate listings**: Updates existing by `external_url`

### Monitoring
Check Vercel logs for cron job execution:
```bash
# Look for:
🚀 Starting Pre-owned Plus sync...
✅ Pre-owned Plus sync completed successfully!
🎉 Sync complete! Processed N listings
```

## Testing Checklist

- [ ] Parser compiles without errors
- [ ] Fetches all pages until no listings found
- [ ] Filters out listings without price
- [ ] Downloads and uploads images to Supabase Storage
- [ ] Inserts new listings to production database
- [ ] Updates existing listings
- [ ] Deactivates removed listings
- [ ] Shows correct company name on listing detail page
- [ ] Phone number displays correctly
- [ ] Email does not display (null)
- [ ] No "Partner" badge shown
- [ ] Cron job runs successfully at 14:00 UTC

## Deployment

### 1. Compile Parser
```bash
npx tsc scripts/parsers/preOwnedPlusParser.ts --outDir scripts/parsers/dist --esModuleInterop --resolveJsonModule --skipLibCheck
```

### 2. Commit and Push
```bash
git add .
git commit -m "Add Pre-owned Plus parser (San Antonio, TX)"
git push origin main
```

### 3. Verify Production
- Check Vercel deployment status
- Wait for next cron run (14:00 UTC)
- Or manually trigger: `curl -X GET "https://carlynx.com/api/cron/sync-mars-dealership" -H "x-cron-secret: YOUR_SECRET"`

## Statistics
- **Average listings**: ~90 vehicles
- **Update frequency**: Daily at 14:00 UTC (5 PM Estonian Time)
- **Data retention**: Listings marked inactive after 24h of not being seen

## Notes
- Pre-owned Plus uses a different inventory system than Mars Dealership and Auto Boutique Texas
- Pagination stops automatically when page returns no listings
- VIN extraction from Carfax links is optional (may not always be available)
- City ID lookup is fuzzy (case-insensitive ILIKE match)
