# DealerCenter Integration Information

**Date**: November 25, 2025  
**Status**: Production Ready  
**CarLynx Dealer Portal**: https://carlynx.us/dealers

---

## Overview

CarLynx provides **automatic dealer onboarding and listing import** for DealerCenter partners. Dealers are automatically registered when their inventory feed is first received, with no manual registration required.

### Key Features
- ✅ **Automatic dealer registration** from first CSV feed
- ✅ **CSV feed ingestion** with field mapping
- ✅ **5 free listings** for unsubscribed dealers
- ✅ **Recurring monthly subscriptions** via Stripe
- ✅ **Email notifications** (welcome, payment failed, expiring)
- ✅ **Automatic listing limits** enforcement
- ✅ **FTP/SFTP support** (coming soon)

---

## Integration Methods

### Method 1: CSV Feed Upload (Recommended)

**POST** `/api/dealercenter/feed/ingest`

Upload CSV file containing dealer info and vehicle inventory.

**Authentication**: API key via `Authorization: Bearer {API_KEY}` header

**Request**: `Content-Type: text/csv` (raw CSV data in body)

**CSV Format**: Must include these columns (see Field Mapping section below):
- `AccountID` or `DCID` - Dealer identifier
- `DealerName`, `Phone`, `Address`, `City`, `State`, `Zip` - Dealer info (first row only)
- `StockNumber`, `Year`, `Make`, `Model`, `Price`, `Odometer` - Required vehicle fields
- `Transmission`, `VIN`, `VehicleDescription`, `PhotoURLs` - Recommended fields

**Example CSV**:
```csv
AccountID,DCID,DealerName,Phone,Address,City,State,Zip,StockNumber,Year,Make,Model,Price,Odometer,Transmission,VIN,VehicleDescription,PhotoURLs
DC12345,12345,Sunshine Motors,555-0123,123 Main St,Austin,TX,78701,A001,2020,Honda,Accord,24999,35000,Automatic,1HGCV1F30LA123456,Clean CarFax,https://example.com/photo1.jpg
DC12345,12345,Sunshine Motors,555-0123,123 Main St,Austin,TX,78701,A002,2019,Toyota,Camry,22999,42000,Automatic,4T1BF1FK5KU123456,One owner,https://example.com/photo2.jpg
```

**Response**:
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

**What Happens Automatically**:
1. First CSV from new dealer → dealer auto-created with 5 free listings
2. Welcome email sent with activation link
3. Listings imported (first 5 active for free)
4. Dealer can activate subscription to unlock full capacity
5. Subsequent CSV uploads update existing listings

---

## Field Mapping

### DealerCenter CSV → CarLynx Database

| DealerCenter Field | CarLynx Field | Type | Required | Notes |
|-------------------|---------------|------|----------|-------|
| `AccountID` | `dealercenter_account_id` | string | Yes* | Primary dealer identifier |
| `DCID` | `dcid` | string | Yes* | Alternative identifier |
| `DealerName` | `dealer_name` | string | Yes | Dealer business name |
| `Phone` | `contact_phone` | string | Yes | Contact phone |
| `Address` | - | string | No | Not stored |
| `City` | `city_name` | string | Yes | Matched to cities table |
| `State` | `state_id` | string | Yes | Matched to states table (code) |
| `Zip` | - | string | No | Not stored |
| `StockNumber` | `external_id` | string | Yes | Prefixed with `DC-{token}-` |
| `VIN` | `vin` | string | Yes | 17-character VIN |
| `Year` | `year` | number | Yes | Model year |
| `Make` | `brand` | string | Yes | Manufacturer name |
| `Model` | `model` | string | Yes | Model name |
| `Trim` | Added to `title` | string | Yes | Vehicle trim level |
| `Odometer` | `mileage` | number | Yes | Mileage |
| `SpecialPrice` | `price` | number | Yes | Price in USD |
| `ExteriorColor` | - | string | No | Not stored |
| `InteriorColor` | - | string | No | Not stored |
| `Transmission` | `transmission` | string | Yes | Automatic, Manual, etc. |
| `PhotoURLs` | `image_url`, `image_url_2`, `image_url_3`, `image_url_4` | string | No | Pipe-delimited URLs (max 4) |
| `VehicleDescription` | `description` | string | No | Full description |
| `EquipmentCode` | - | string | No | Not stored |
| `LatestPhotoModifiedDate` | - | string | No | Not stored |

*Either `AccountID` or `DCID` required

---

## Method 2: JSON API (Legacy)

### 1. Register New Dealer
**POST** `/api/dealercenter/register`

**Request**:
```json
{
  "dealer_name": "Sunshine Motors",
  "contact_email": "manager@sunshinemotors.com",
  "contact_phone": "+1-555-0123"
}
```

**Response**:
```json
{
  "success": true,
  "activation_token": "x7k9m2p5q8r1s4t6",
  "activation_url": "https://carlynx.us/dealers/activate/x7k9m2p5q8r1s4t6"
}
```

### 2. Submit Listings
**POST** `/api/dealercenter/listings`

**Request**:
```json
{
  "activation_token": "x7k9m2p5q8r1s4t6",
  "listings": [
    {
      "external_id": "A001",
      "title": "2020 Honda Accord",
      "year": 2020,
      "brand": "Honda",
      "model": "Accord",
      "price": 24999,
      "mileage": 35000,
      "transmission": "Automatic",
      "vin": "1HGCV1F30LA123456",
      "description": "Clean CarFax",
      "image_url": "https://example.com/photo1.jpg"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "processed": 1,
  "inserted": 1,
  "updated": 0
}
```

---

## Subscription System

### Free Trial
- **5 free listings** for all new dealers (status: `pending`)
- Automatically applied on first feed
- No payment required to get started

### Tier Pricing (Recurring Monthly)

| Tier | Max Listings | Monthly Price | Stripe Price ID |
|------|-------------|---------------|----------------|
| Tier 100 | 100 | $29/mo | *Created on activation* |
| Tier 250 | 250 | $49/mo | *Created on activation* |
| Tier 500 | 500 | $79/mo | *Created on activation* |
| Tier 1000 | 1000 | $129/mo | *Created on activation* |
| Tier Unlimited | Unlimited | $199/mo | *Created on activation* |

**Subscription Type**: Recurring monthly via Stripe Checkout  
**Auto-renewal**: Yes, automatically charges card each month  
**Cancellation**: Can cancel anytime from Stripe portal

### Activation Flow

1. **Dealer sends first CSV** → Auto-registered with `pending` status + 5 free listings
2. **Welcome email sent** with activation link: `/dealers/activate/{token}`
3. **Dealer clicks link** → Selects subscription tier
4. **Stripe Checkout** → Enters payment info
5. **Subscription created** → Status becomes `active`, full listing limit unlocked
6. **Auto-renewal** → Charged monthly, subscription auto-extends

### Status Lifecycle

```
pending → active → past_due → cancelled
         ↑________|
       (auto-renew)
```

- `pending`: Free trial (5 listings)
- `active`: Paid subscription active
- `past_due`: Payment failed, grace period
- `cancelled`: Subscription ended, listings deactivated

---

## Email Notifications

### Welcome Email
**Trigger**: First CSV feed from new dealer  
**Sender**: noreply@carlynx.us  
**Recipient**: Dealer contact email  
**Content**: Activation link + 5 free listings info

### Payment Failed
**Trigger**: Stripe invoice.payment_failed webhook  
**Recipient**: Dealer contact email  
**Content**: Update payment method link + expiration warning

### Expiring Soon (7 days)
**Trigger**: Cron job (daily 10 AM)  
**Recipient**: Dealers expiring in 7 days  
**Content**: Renewal reminder

### Cancelled
**Trigger**: Subscription cancellation  
**Recipient**: Dealer contact email  
**Content**: Listings deactivated notice + reactivation link

---

## Listing Limits Enforcement

### Automatic Enforcement
- **Cron job**: Every 6 hours
- **Function**: `enforce_all_dealercenter_limits()`
- **Action**: Deactivates oldest listings exceeding max_listings

### Priority Rules
- **Active subscriptions**: Full tier limit (e.g., 250 listings)
- **Pending (free trial)**: 5 listings max
- **Cancelled/expired**: 0 listings (all deactivated)

### Which Listings Get Deactivated?
- Sorted by `last_seen_at` (oldest first)
- Then by `created_at` (oldest first)
- **Newest listings stay active**

Example: Dealer has 250-listing tier but 300 active listings → 50 oldest deactivated

---

## Cron Jobs Schedule

| Job Name | Schedule | Function | Purpose |
|----------|----------|----------|---------|
| `enforce-dealercenter-listing-limits` | Every 6 hours | `enforce_all_dealercenter_limits()` | Deactivate excess listings |
| `expire-dealercenter-subscriptions` | Daily 2:00 AM | Update status to `cancelled` | Mark expired subscriptions |
| `deactivate-expired-dealer-listings` | Daily 2:15 AM | Set `is_active=false` | Deactivate cancelled dealer listings |
| `check-expiring-dealercenter-subscriptions` | Daily 10:00 AM | `check_expiring_dealercenter_subscriptions()` | Find dealers expiring in 7 days |

---

## FTP/SFTP Upload (Coming Soon)

**Planned Features**:
- CarLynx will provide FTP/SFTP credentials
- DealerCenter uploads CSV to `/dealercenter/feeds/` directory
- Cron job picks up files hourly and processes via `/feed/ingest`
- Files archived after processing

**Status**: Not yet implemented (use POST endpoint for now)

---

## Webhook Events

### Stripe Webhooks
**Endpoint**: `/api/dealer/webhooks/stripe`  
**Secret**: `STRIPE_WEBHOOK_SECRET_DEALER` env variable

**Handled Events**:
- `checkout.session.completed` → Mark payment success
- `customer.subscription.created` → Activate dealer subscription
- `customer.subscription.updated` → Update status/expiration
- `customer.subscription.deleted` → Cancel subscription
- `invoice.payment_failed` → Send payment failed email
- `invoice.payment_succeeded` → Confirm active status

---

## Check Dealer Status
**GET** `/api/dealercenter/status/{token}`

**No API key required** (public endpoint)

**Response**:
```json
{
  "dealer_name": "Sunshine Motors",
  "contact_email": "manager@sunshinemotors.com",
  "subscription_status": "active",
  "tier_id": 2
}
```

---

## Error Responses

```json
{
  "error": "Error description",
  "details": "Additional context (optional)"
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad request (invalid CSV, missing fields)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (subscription inactive)
- `404` - Not found (invalid token)
- `500` - Internal server error

---

## Testing Checklist

- [ ] Send CSV with new dealer → Verify auto-registration
- [ ] Check welcome email received
- [ ] Click activation link → Verify 5 tier options shown
- [ ] Complete Stripe payment → Verify subscription active
- [ ] Send CSV with 10 listings → Verify all imported
- [ ] Wait for subscription expiry → Verify listings deactivated
- [ ] Reactivate subscription → Verify listings restored

---

## Database Schema Reference

### `dealercenter_dealers` Table
```sql
- id: uuid (PK)
- dealercenter_account_id: text (unique)
- dcid: text
- activation_token: text (unique, 16 chars)
- dealer_name: text
- contact_email: text
- contact_phone: text
- subscription_status: enum (pending, active, past_due, cancelled)
- tier_id: int (FK → subscription_tiers)
- max_listings: int (from tier)
- activation_date: timestamptz
- expiration_date: timestamptz
- stripe_customer_id: text
- stripe_subscription_id: text
- stripe_session_id: text
- welcome_email_sent: boolean
- last_payment_date: timestamptz
```

### `external_listings` Table (DealerCenter source)
```sql
- source: 'dealercenter'
- external_id: 'DC-{token}-{stock_number}'
- title, year, brand, model, price, mileage
- transmission, vin, description
- image_url (1-4)
- contact_phone, state_id, city_id
- is_active: boolean
- last_seen_at: timestamptz
```

---

## API Authentication

**Header**: `Authorization: Bearer YOUR_API_KEY`

**Example**:
```bash
curl -H "Authorization: Bearer dc_live_gap457yshfvx8mdbwqkcje0lzi3n21u9" \
  https://carlynx.us/api/dealercenter/feed/ingest
```

**Environment Variable**: `DEALERCENTER_API_KEY`

**Required for**:
- `/api/dealercenter/feed/ingest`
- `/api/dealercenter/register`
- `/api/dealercenter/listings`

**Not required for**:
- `/api/dealercenter/status/{token}` (public)

---

## Support & Contact

**CarLynx Technical Contact**:
- Email: support@carlynx.us
- Response Time: Within 24 hours
- API Issues: High priority (4-hour response)

**Production Details**:
- Base URL: https://carlynx.us
- Stripe: Production mode (live keys)
- Email: Resend (carlynx.us domain verified)

---

**Last Updated**: November 25, 2025  
**API Version**: 2.0  
**Status**: Production Ready ✅  
**Integration Type**: Automatic CSV Feed + Recurring Subscriptions
