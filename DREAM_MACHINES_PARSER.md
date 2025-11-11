# Dream Machines of Texas Parser

## Overview
Parses motorcycle listings from Dream Machines of Texas dealership in Dallas, TX.

## Features
- ✅ Parses up to 10 pages of inventory (~200+ motorcycles)
- ✅ Extracts year, make, model, price, mileage
- ✅ Downloads up to 4 images per listing
- ✅ TEST MODE for development (1 motorcycle only)
- ✅ Updates existing listings automatically
- ✅ Handles multiple brands: Harley-Davidson, BMW, Indian, Honda, Kawasaki, etc.

## Dealer Information
- **Name**: Dream Machines of Texas
- **Location**: Dallas, Texas
- **Phone**: 972-380-5151
- **Website**: https://www.dreammachinesoftexas.com/
- **Vehicle Type**: Motorcycles

## Database Fields
- `source`: 'dream_machines_texas'
- `vehicle_type`: 'Motorcycle'
- `city_name`: 'Dallas'
- `state_id`: Texas (1)
- `contact_phone`: '972-380-5151'
- Images: up to 4 per listing

## Usage

### Test Mode (1 motorcycle)
1. Edit `dreamMachinesParser.ts`
2. Set `TEST_MODE = true`
3. Run: `npx ts-node scripts/parsers/dreamMachinesParser.ts`
4. Or use: `test-dream-machines.bat`

### Full Mode (10 pages)
1. Ensure `TEST_MODE = false` in `dreamMachinesParser.ts`
2. Run: `npx ts-node scripts/parsers/dreamMachinesParser.ts`
3. Or use: `run-dream-machines.bat`

## Example Output
```
🚀 Dream Machines of Texas Parser
📍 Mode: FULL (10 pages)
==================================================
🔍 Fetching Dream Machines of Texas listings...

📄 Fetching page 1...
   Found 160 listings on page 1

   🏍️  Processing: https://www.dreammachinesoftexas.com/...
      Title: 2025 BMW M 1000 XR Light White / M Motorsport
      Year: 2025, Make: BMW, Model: M 1000 XR Light White / M Motorsport
      Price: $25999
      Mileage: 2581 miles
      Fetching images...
      Found 4 images

✅ Total listings scraped: 200

💾 Saving listings to Supabase...
   Texas state_id: 1
   Dallas city_id: 3
   ✅ Saved: 2025 BMW M 1000 XR Light White / M Motorsport
   ...

📊 Summary:
   ✅ New listings saved: 180
   🔄 Listings updated: 20
   ❌ Errors: 0

✅ Parser completed successfully
```

## Parsing Logic

### Title Parsing
Extracts year, make, and model from title:
- Example: "2025 Harley-Davidson® FXLRS - Low Rider® S"
- Year: 2025
- Make: Harley-Davidson
- Model: FXLRS - Low Rider S

### Price Parsing
Extracts from "Our Price $XX,XXX" format

### Mileage Parsing
Extracts from description: "X,XXX miles"

### Images
- Fetches up to 4 high-quality images
- Filters out logos, icons, placeholders
- Minimum width: 200px

## Integration

### Frontend Display
External listings from Dream Machines appear with:
- Orange "Partner" badge (if needed, update badge logic)
- "Visit Dealer Website" button
- Contact buttons (WhatsApp, Call, Email)

### Search & Filters
- Appears in search results
- Filterable by year, make, model, price
- Can be excluded with "Private Sellers Only" filter

## Maintenance

### Cron Job
Add to Vercel cron or run manually:
```json
{
  "crons": [{
    "path": "/api/cron/sync-dream-machines",
    "schedule": "0 2 * * *"
  }]
}
```

### Monitoring
Check parser logs for:
- Connection errors
- Changed HTML structure
- Missing images
- Price format changes

## Notes
- First listing may be a boat (Howard Custom Boats 255 VTX)
- Parser handles compound make names (Harley-Davidson, Indian Motorcycle)
- All listings set to Dallas, Texas by default
- No email contact available (set to null)
