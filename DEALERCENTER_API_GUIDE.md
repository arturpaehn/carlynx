# DealerCenter API Integration Guide

## 🎯 Overview

This document describes the API endpoints for DealerCenter integration with CarLynx. DealerCenter dealers do **NOT** create user accounts - they use a token-based activation system.

---

## 🔑 Authentication

All API requests (except `/status` endpoint) require an API key sent in the header:

```http
x-api-key: YOUR_DEALERCENTER_API_KEY
```

**Environment Variable**: `DEALERCENTER_API_KEY`

---

## 📡 API Endpoints

### 1. Register Dealer

**POST** `/api/dealercenter/register`

Creates a new dealer registration and generates an activation token.

#### Request:
```json
{
  "dealer_name": "John's Auto Sales",
  "contact_email": "john@autosales.com",
  "contact_phone": "+1234567890",
  "tier_id": "uuid-of-tier",
  "notes": "Optional notes"
}
```

#### Response:
```json
{
  "success": true,
  "dealer_id": "uuid",
  "activation_token": "abc123xyz456",
  "activation_url": "https://carlynx.us/dealers/activate/abc123xyz456",
  "tier": {
    "name": "Professional",
    "price": 79,
    "listing_limit": 500
  }
}
```

#### Available Tiers:
- **Starter**: $29/month - 100 listings
- **Growth**: $49/month - 250 listings
- **Professional**: $79/month - 500 listings
- **Enterprise**: $129/month - 1000 listings
- **Ultimate**: $199/month - Unlimited listings

#### Next Steps:
1. Send activation email to dealer with `activation_url`
2. Dealer visits URL and pays via Stripe
3. Upon payment, subscription becomes active for 30 days

---

### 2. Submit Listings

**POST** `/api/dealercenter/listings`

Submit batch of listings for a dealer. Creates new listings or updates existing ones.

#### Request:
```json
{
  "activation_token": "abc123xyz456",
  "listings": [
    {
      "external_id": "listing-123",
      "title": "2020 Honda Accord",
      "year": 2020,
      "brand": "Honda",
      "model": "Accord",
      "price": 25000,
      "mileage": 30000,
      "transmission": "Automatic",
      "fuel_type": "Gasoline",
      "vin": "1HGCV1F3XLA123456",
      "description": "Excellent condition",
      "vehicle_type": "car",
      "engine_size": "2.0",
      "external_url": "https://yourdealersite.com/accord-123",
      "image_urls": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "state_code": "TX",
      "city_name": "Dallas"
    }
  ]
}
```

#### Field Details:

**Required:**
- `external_id` (string) - Your unique listing ID
- `title` (string) - Listing title
- `year` (number) - Vehicle year
- `price` (number) - Price in USD

**Optional:**
- `brand` (string) - Vehicle brand (Honda, Toyota, etc.)
- `model` (string) - Vehicle model
- `mileage` (number) - Odometer reading
- `transmission` (string) - "Automatic" or "Manual"
- `fuel_type` (string) - "Gasoline", "Diesel", "Electric", "Hybrid"
- `vin` (string) - Vehicle Identification Number (17 chars)
- `description` (string) - Full description
- `vehicle_type` (string) - "car", "motorcycle", "atv", "boat", "truck"
- `engine_size` (string) - Engine size as number, e.g., "2.0", "3.5", "600" (for motorcycles cc)
- `external_url` (string) - Link to listing on your website (if available)
- `image_urls` (array) - Up to 4 image URLs
- `state_code` (string) - Two-letter state code (TX, CA, etc.)
- `city_name` (string) - City name

#### Response:
```json
{
  "success": true,
  "inserted": 5,
  "updated": 2,
  "total_processed": 7,
  "errors": []
}
```

#### Error Response:
```json
{
  "success": true,
  "inserted": 4,
  "updated": 2,
  "total_processed": 7,
  "errors": [
    "Failed to insert listing-789: Invalid state code"
  ]
}
```

#### Listing Limits:
- Automatically checks dealer's tier limit
- If limit exceeded, returns 403 error
- Existing listings count toward limit

---

### 3. Delete/Deactivate Listings

**DELETE** `/api/dealercenter/listings?token={token}&listing_ids={ids}`

Deactivate specific listings or all dealer's listings.

#### Query Parameters:
- `token` (required) - Activation token
- `listing_ids` (optional) - Comma-separated list of external_ids

#### Examples:

**Deactivate specific listings:**
```http
DELETE /api/dealercenter/listings?token=abc123&listing_ids=listing-1,listing-2,listing-3
```

**Deactivate ALL dealer's listings:**
```http
DELETE /api/dealercenter/listings?token=abc123
```

#### Response:
```json
{
  "success": true,
  "deactivated": 15
}
```

---

### 4. Check Dealer Status

**GET** `/api/dealercenter/status/[token]`

Check dealer subscription status and usage. **No API key required** (public endpoint).

#### Request:
```http
GET /api/dealercenter/status/abc123xyz456
```

#### Response:
```json
{
  "dealer_name": "John's Auto Sales",
  "contact_email": "john@autosales.com",
  "contact_phone": "+1234567890",
  "subscription_status": "active",
  "tier": {
    "name": "Professional",
    "price": 79,
    "listing_limit": 500
  },
  "max_listings": 500,
  "active_listings_count": 125,
  "activation_date": "2025-01-13T10:00:00Z",
  "expiration_date": "2025-02-12T10:00:00Z",
  "days_remaining": 30,
  "created_at": "2025-01-13T09:00:00Z"
}
```

#### Subscription Statuses:
- `pending` - Dealer registered but not paid yet
- `active` - Paid and active
- `expired` - 30 days passed, listings deactivated
- `canceled` - Manually canceled

---

## 🔄 Workflow

### Step 1: Register Dealer
```bash
POST /api/dealercenter/register
{
  "dealer_name": "John's Auto Sales",
  "contact_email": "john@autosales.com",
  "tier_id": "..."
}
```

### Step 2: Send Activation Email
- Email dealer with activation URL
- Dealer visits link and pays via Stripe
- Payment triggers webhook → dealer becomes active

### Step 3: Submit Listings
```bash
POST /api/dealercenter/listings
{
  "activation_token": "abc123",
  "listings": [...]
}
```

### Step 4: Monitor Status
```bash
GET /api/dealercenter/status/abc123
```

### Step 5: Auto-Expiration
- After 30 days, dealer status changes to `expired`
- All listings automatically deactivated
- Dealer must pay again to reactivate

---

## 🗄️ Database Structure

### `dealercenter_dealers` Table
```sql
- id (uuid)
- activation_token (text, unique)
- dealer_name (text)
- contact_email (text)
- contact_phone (text)
- tier_id (uuid, FK to subscription_tiers)
- subscription_status (pending|active|expired|canceled)
- max_listings (int)
- activation_date (timestamptz)
- expiration_date (timestamptz)
- stripe_customer_id (text)
- stripe_payment_intent_id (text)
```

### `external_listings` Table
Listings stored with:
```sql
- source = 'dealercenter'
- external_id = 'DC-{token}-{your_listing_id}'
- contact_phone = from dealer record
- contact_email = from dealer record
```

---

## 🔐 Security

### API Key Management
- Store `DEALERCENTER_API_KEY` in environment variables
- Use different keys for development/production
- Rotate keys periodically

### Token Security
- Activation tokens are 16 characters, alphanumeric
- Unique per dealer
- Cannot be changed after creation

---

## 🧪 Testing

### 1. Test Registration
```bash
curl -X POST https://carlynx.us/api/dealercenter/register \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dealer_name": "Test Dealer",
    "contact_email": "test@example.com",
    "tier_id": "TIER_UUID"
  }'
```

### 2. Test Listings Submit
```bash
curl -X POST https://carlynx.us/api/dealercenter/listings \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "activation_token": "abc123",
    "listings": [
      {
        "external_id": "test-1",
        "title": "2020 Honda Accord",
        "year": 2020,
        "price": 25000
      }
    ]
  }'
```

### 3. Test Status Check
```bash
curl https://carlynx.us/api/dealercenter/status/abc123
```

---

## 📧 Email Notifications

### TODO: Implement Email Templates

**Welcome Email** (after registration):
- Subject: "Welcome to CarLynx DealerCenter"
- Body: Activation link, tier details, instructions

**Payment Confirmation** (after payment):
- Subject: "Payment Confirmed - Your Listings Are Live!"
- Body: Expiration date, listing limit, contact info

**Expiring Soon** (7 days before):
- Subject: "Your CarLynx Subscription Expires Soon"
- Body: Renewal instructions, current stats

**Expired** (on expiration):
- Subject: "Your CarLynx Subscription Has Expired"
- Body: Reactivation link, listings deactivated

---

## 🚀 Production Setup

### Environment Variables
```bash
# .env.local
DEALERCENTER_API_KEY=your-secret-key-here
NEXT_PUBLIC_SITE_URL=https://carlynx.us
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET_DEALER=whsec_...
```

### Database Migration
```bash
# Apply migration
supabase migration up
```

### Stripe Webhook
Configure webhook endpoint:
```
https://carlynx.us/api/dealer/webhooks/stripe
```

Events to listen for:
- `checkout.session.completed`

---

## 🆘 Support

### Common Issues

**"Invalid activation token"**
- Check token spelling
- Verify dealer exists in database

**"Listing limit exceeded"**
- Check dealer's tier limit
- Count active listings
- Upgrade tier if needed

**"Subscription expired"**
- Check expiration_date
- Dealer must pay again

**"Unauthorized - Invalid API key"**
- Check DEALERCENTER_API_KEY environment variable
- Verify header: `x-api-key`

---

## 📊 Monitoring

### Cron Job: Auto-Expire Subscriptions
Run daily to expire old subscriptions:

```sql
SELECT expire_dealercenter_subscriptions();
```

This function:
1. Marks expired dealers as `expired`
2. Deactivates their listings
3. Should run via Supabase cron or external scheduler

---

## 🔄 Future Enhancements

- [ ] Bulk listing deletion by date range
- [ ] Analytics API (views, clicks per listing)
- [ ] Webhook notifications to DealerCenter
- [ ] Auto-renewal option
- [ ] Listing performance reports

---

**Last Updated**: January 13, 2025
**Version**: 1.0
