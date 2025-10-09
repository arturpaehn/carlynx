# 🚀 Quick Deployment Guide - Mars Dealership Integration

## ✅ Pre-Deployment (Already Complete)
- [x] Database migration applied
- [x] Parser tested locally (44 listings synced)
- [x] Frontend integration complete (homepage + search)
- [x] Location data configured (Dallas, TX)

## 📋 Deployment Steps

### 1. Commit & Push Code
```bash
git add .
git commit -m "Add Mars Dealership external listings integration"
git push origin main
```

Vercel will automatically deploy.

### 2. Add Environment Variable in Vercel

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add:**
```
Key: CRON_SECRET
Value: <generate-random-string>
```

**Generate secure secret:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use any random string generator
```

**Important:** Add for all environments (Production, Preview, Development)

### 3. Verify Deployment

**Check Vercel Dashboard:**
- Deployment status: ✅ Success
- Cron jobs: Should show `/api/cron/sync-mars-dealership` with schedule `0 14 * * *`

**Test Live Site:**
```
https://carlynx.us/
```

Look for:
- [ ] External listings on homepage with "Partner" badge
- [ ] Search results include external listings
- [ ] Partner badge visible in search
- [ ] Clicking external listing opens new tab to marsdealership.com

### 4. Manual Trigger (Optional)

To test cron immediately without waiting for scheduled time:

```bash
curl -X GET "https://carlynx.us/api/cron/sync-mars-dealership" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Replace `YOUR_CRON_SECRET` with the value you set in Vercel.

### 5. Monitor First Scheduled Run

**Next run:** Tomorrow at 5:00 PM Estonian Time (14:00 UTC)

**Check logs:**
- Vercel Dashboard → Your Project → Deployments → Functions
- Look for `/api/cron/sync-mars-dealership`

**Expected output:**
```
🚀 Starting Mars Dealership sync...
⏰ Time: <timestamp> (Estonian Time)
🔍 Fetching Mars Dealership listings...
📄 Fetching page 1...
  ✅ Found 10-12 listings on page 1
...
✅ Total listings found: 44
🔄 Syncing 44 listings to database...
✅ Updated/Created listings
✅ Deactivated removed listings
🎉 Sync complete!
```

## 🐛 Troubleshooting

### Issue: "Unauthorized" error in cron logs
**Solution:** Verify `CRON_SECRET` is set correctly in Vercel Environment Variables

### Issue: No external listings showing on site
**Solution:** 
1. Check RLS policies: `external_listings` should have policy "External listings are viewable by everyone"
2. Check `is_active = true` in database
3. Verify frontend queries are correct

### Issue: Parser fails with "Cannot find listings"
**Solution:** Mars Dealership may have changed HTML structure
1. Run `npx tsx scripts/inspect-html.ts` locally
2. Update selectors in `marsDealershipParser.ts`
3. Redeploy

### Issue: Images not loading
**Solution:** 
1. Check Storage bucket `external-listing-images` exists
2. Verify bucket is public
3. Check RLS policies on `storage.objects`

## 📊 Success Verification

After deployment, verify:

```bash
# 1. Check database (locally)
npx tsx scripts/check-external-listings.ts

# Expected: 44+ external listings with all fields populated

# 2. Test homepage
# Open: https://carlynx.us/
# Look for: Partner badge on some listings

# 3. Test search
# Open: https://carlynx.us/search-results?vehicle_type=car&state_id=1
# Look for: External listings mixed with regular listings

# 4. Test external link
# Click any Partner listing
# Verify: Opens marsdealership.com in new tab
```

## 🔐 Security Notes

1. **CRON_SECRET** - Keep private, rotate periodically
2. **SUPABASE_SERVICE_ROLE_KEY** - Already in Vercel, do not expose
3. **RLS Policies** - Ensure only `service_role` can INSERT/UPDATE external_listings
4. **Rate Limiting** - Parser has 500ms delay between pages (polite scraping)

## 📅 Maintenance Schedule

**Daily:** Automatic sync at 5 PM Estonian Time
**Weekly:** Check Vercel cron logs for errors
**Monthly:** Verify Mars Dealership site structure hasn't changed

## 🎉 You're Done!

External listings integration is now live. Mars Dealership vehicles will automatically sync daily and appear in search results with a Partner badge.

**Questions?** Check `MARS_DEALERSHIP_INTEGRATION.md` for detailed documentation.
