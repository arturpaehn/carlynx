# DealerCenter API - Quick Start

## 🔑 API Key
All requests need header:
```
x-api-key: YOUR_API_KEY
```

---

## 1️⃣ Register a Dealer

**Endpoint**: `POST https://carlynx.us/api/dealercenter/register`

**Request**:
```json
{
  "dealer_name": "Mike's Motors",
  "contact_email": "mike@mikesmotors.com",
  "contact_phone": "+1-555-123-4567",
  "tier_id": "GET_FROM_CARLYNX",
  "notes": "Referred by John"
}
```

**Response**:
```json
{
  "success": true,
  "dealer_id": "550e8400-e29b-41d4-a716-446655440000",
  "activation_token": "x7k9m2p5q8r1s4t6",
  "activation_url": "https://carlynx.us/dealers/activate/x7k9m2p5q8r1s4t6",
  "tier": {
    "name": "Professional",
    "price": 79,
    "listing_limit": 500
  }
}
```

**Next**: Send activation email to dealer with the URL

---

## 2️⃣ Send Listings

**Endpoint**: `POST https://carlynx.us/api/dealercenter/listings`

**Request**:
```json
{
  "activation_token": "x7k9m2p5q8r1s4t6",
  "listings": [
    {
      "external_id": "INV-12345",
      "title": "2020 Honda Accord Sport",
      "year": 2020,
      "brand": "Honda",
      "model": "Accord",
      "price": 24500,
      "mileage": 32000,
      "transmission": "Automatic",
      "fuel_type": "Gasoline",
      "vin": "1HGCV1F30LA012345",
      "description": "One owner, excellent condition, clean title",
      "vehicle_type": "car",
      "engine_size": "2.0",
      "external_url": "https://yourdealersite.com/inventory/12345",
      "image_urls": [
        "https://example.com/images/accord-front.jpg",
        "https://example.com/images/accord-side.jpg",
        "https://example.com/images/accord-interior.jpg"
      ],
      "state_code": "TX",
      "city_name": "Dallas"
    },
    {
      "external_id": "INV-12346",
      "title": "2019 Toyota Camry LE",
      "year": 2019,
      "brand": "Toyota",
      "model": "Camry",
      "price": 21000,
      "mileage": 45000,
      "transmission": "Automatic",
      "fuel_type": "Gasoline",
      "vehicle_type": "car",
      "state_code": "TX"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "inserted": 2,
  "updated": 0,
  "total_processed": 2
}
```

---

## 3️⃣ Check Status

**Endpoint**: `GET https://carlynx.us/api/dealercenter/status/{token}`

**No API key needed for this endpoint**

**Example**:
```
GET https://carlynx.us/api/dealercenter/status/x7k9m2p5q8r1s4t6
```

**Response**:
```json
{
  "dealer_name": "Mike's Motors",
  "contact_email": "mike@mikesmotors.com",
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
  "days_remaining": 30
}
```

---

## 4️⃣ Delete Listings

**Endpoint**: `DELETE https://carlynx.us/api/dealercenter/listings`

**Delete specific listings**:
```
DELETE https://carlynx.us/api/dealercenter/listings?token=x7k9m2p5q8r1s4t6&listing_ids=INV-12345,INV-12346
```

**Delete ALL dealer's listings**:
```
DELETE https://carlynx.us/api/dealercenter/listings?token=x7k9m2p5q8r1s4t6
```

**Response**:
```json
{
  "success": true,
  "deactivated": 2
}
```

---

## 📋 Required Fields

**Minimum required for a listing**:
- `external_id` - Your listing ID
- `title` - Listing title
- `year` - Vehicle year
- `price` - Price in USD

**Recommended fields**:
- `brand`, `model` - For better search
- `mileage` - Buyers want this
- `transmission` - Important filter
- `vehicle_type` - car/motorcycle/truck/etc
- `state_code` - For location
- `image_urls` - At least 1 photo
- `vin` - For verification
- `external_url` - Link back to your site
- `description` - Full details

---

## 🎟️ Subscription Tiers

Get tier UUIDs from CarLynx team:

| Tier | Price | Listings |
|------|-------|----------|
| Starter | $29 | 100 |
| Growth | $49 | 250 |
| Professional | $79 | 500 |
| Enterprise | $129 | 1000 |
| Ultimate | $199 | Unlimited |

---

## 🔄 Workflow Summary

1. **Register dealer** → Get activation token
2. **Send activation email** → Dealer pays via Stripe
3. **Wait for payment** → Check status until "active"
4. **Send listings** → Can send multiple times
5. **Auto-expires** → After 30 days, need new payment

---

## ⚠️ Important Notes

- **Token never expires** - Same token used for entire dealer relationship
- **Payment = 30 days** - Not recurring subscription
- **Listing limit enforced** - API returns error if exceeded
- **Updates handled** - Sending same `external_id` updates existing listing
- **Auto-deactivation** - Listings turn off after 30 days

---

## 📞 Contact

Questions? Contact CarLynx team at:
- Email: support@carlynx.us
- Include dealer name and token for support

---

## 🧪 Test API Key

```
x-api-key: test_dealercenter_12345
```

Use this for testing on `https://carlynx.us`
