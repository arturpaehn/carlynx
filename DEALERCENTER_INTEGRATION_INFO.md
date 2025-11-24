# DealerCenter Integration Information

**Date**: January 13, 2025  
**Status**: Production Ready  
**CarLynx Dealer Portal**: https://carlynx.us/dealers

---

## API Endpoints

All endpoints are hosted at: **https://carlynx.us/api/dealercenter**

### Authentication

All endpoints (except `/status/{token}`) require API key authentication via header:

```
x-api-key: <YOUR_API_KEY_PROVIDED_BY_CARLYNX>
```

---

## Available Endpoints

### 1. Register New Dealer
**POST** `/api/dealercenter/register`

Register a new dealer and receive an activation link.

**Request**:
```json
{
  "dealer_name": "Sunshine Motors",
  "contact_email": "manager@sunshinemotors.com",
  "contact_phone": "+1-555-0123",
  "tier_id": "<TIER_UUID_PROVIDED_BY_CARLYNX>",
  "notes": "Optional notes"
}
```

**Response**:
```json
{
  "success": true,
  "dealer_id": "uuid",
  "activation_token": "x7k9m2p5q8r1s4t6",
  "activation_url": "https://carlynx.us/dealers/activate/x7k9m2p5q8r1s4t6"
}
```

**Next Steps**: Send the `activation_url` to the dealer. They will use this link to complete payment and activate their subscription.

---

### 2. Submit/Update Listings
**POST** `/api/dealercenter/listings`

Submit new vehicle listings or update existing ones.

**Request**:
```json
{
  "token": "x7k9m2p5q8r1s4t6",
  "listings": [
    {
      "external_id": "INV-12345",
      "title": "2020 Honda Accord",
      "year": 2020,
      "brand": "Honda",
      "model": "Accord",
      "price": 24999,
      "mileage": 35000,
      "description": "Clean CarFax, one owner",
      "external_url": "https://yourdealersite.com/inventory/12345",
      "images": [
        "https://yourdealersite.com/images/accord-front.jpg",
        "https://yourdealersite.com/images/accord-interior.jpg"
      ],
      "transmission": "Automatic",
      "fuel_type": "Gasoline",
      "body_type": "Sedan",
      "exterior_color": "Silver",
      "interior_color": "Black",
      "engine_size": "2.0",
      "drivetrain": "FWD",
      "vin": "1HGCV1F30LA123456"
    }
  ]
}
```

**Required Fields**:
- `external_id` (your internal inventory ID)
- `title`
- `year`
- `price`

**Recommended Fields**: brand, model, mileage, transmission, fuel_type, images, external_url

**Response**:
```json
{
  "success": true,
  "processed": 1,
  "inserted": 1,
  "updated": 0,
  "details": [
    {
      "external_id": "INV-12345",
      "status": "inserted",
      "listing_id": "uuid"
    }
  ]
}
```

**Important Notes**:
- Use field `brand` (not "make")
- Use `engine_size` as numeric string like "2.0" (not "2.0L")
- Images must be publicly accessible URLs (array of strings)
- To update: send same `external_id` with new data

---

### 3. Check Dealer Status
**GET** `/api/dealercenter/status/{token}`

Check dealer subscription status and active listings count.

**No API key required** - public endpoint.

**Response**:
```json
{
  "success": true,
  "dealer": {
    "dealer_name": "Sunshine Motors",
    "contact_email": "manager@sunshinemotors.com",
    "subscription_status": "active",
    "activation_date": "2025-01-13T10:00:00Z",
    "expiration_date": "2025-02-12T10:00:00Z"
  },
  "tier": {
    "tier_name": "250 Listings",
    "listing_limit": 250,
    "monthly_price": 49
  },
  "active_listings": 127
}
```

---

### 4. Deactivate Listings
**DELETE** `/api/dealercenter/listings?token={token}&listing_ids={id1,id2,id3}`

Deactivate specific listings (soft delete - sets `is_active = false`).

**Query Parameters**:
- `token`: activation token
- `listing_ids`: comma-separated list of external_ids

**Example**:
```
DELETE /api/dealercenter/listings?token=x7k9m2p5q8r1s4t6&listing_ids=INV-12345,INV-12346
```

**Response**:
```json
{
  "success": true,
  "deactivated": 2
}
```

---

## Payment & Activation Flow

1. **DealerCenter calls** `/register` → receives `activation_url`
2. **Dealer clicks link** → lands on CarLynx payment page
3. **Dealer pays** via Stripe Checkout (one-time payment)
4. **Subscription activates** for 30 days
5. **DealerCenter can submit listings** via `/listings` endpoint

**Subscription Duration**: 30 days from payment date (one-time payment, not recurring)

---

## Tier Pricing (as of January 2025)

| Tier Name | Listing Limit | Price (30 days) | tier_id |
|-----------|---------------|-----------------|---------|
| Up to 100 listings | 100 | $29 | `tier_100` |
| Up to 250 listings | 250 | $49 | `tier_250` |
| Up to 500 listings | 500 | $79 | `tier_500` |
| Up to 1000 listings | 1000 | $129 | `tier_1000` |
| Unlimited listings | Unlimited | $199 | `tier_unlimited` |

**Note**: Use these exact `tier_id` values when calling `/register` endpoint.

---

## Complete Field Reference

### DealerCenter Listing Fields (30 total)

**Required**:
- `external_id` (string) - Your inventory ID
- `title` (string) - Vehicle title
- `year` (number) - Model year
- `price` (number) - Price in USD

**Recommended**:
- `brand` (string) - Manufacturer (Honda, Toyota, etc.)
- `model` (string) - Model name
- `mileage` (number) - Odometer reading
- `transmission` (string) - Automatic, Manual, CVT
- `fuel_type` (string) - Gasoline, Diesel, Electric, Hybrid
- `body_type` (string) - Sedan, SUV, Truck, Coupe, etc.
- `exterior_color` (string)
- `interior_color` (string)
- `images` (array of URLs) - Vehicle photos
- `external_url` (string) - Link to listing on your site

**Optional**:
- `description` (string) - Detailed description
- `engine_size` (string) - "2.0", "3.5", etc.
- `drivetrain` (string) - FWD, RWD, AWD, 4WD
- `vin` (string) - Vehicle identification number
- `trim` (string) - Trim level
- `doors` (number) - Number of doors
- `seats` (number) - Seating capacity
- `mpg_city` (number)
- `mpg_highway` (number)
- `horsepower` (number)
- `cylinders` (number)
- `features` (array of strings)
- `condition` (string) - New, Used, Certified
- `carfax_report_url` (string)
- `stock_number` (string)

---

## Error Handling

All endpoints return standard JSON error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad request (missing/invalid fields)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (subscription inactive or limit reached)
- `404` - Not found (invalid token or tier_id)
- `500` - Internal server error

---

## Rate Limits

**Current Limits**: None (will be implemented if needed)

**Best Practices**:
- Batch listings in groups of 50-100 per request
- Update only changed listings, not entire inventory
- Use webhooks (if available) instead of polling `/status`

---

## Testing

**Test Credentials**: Contact CarLynx technical team for sandbox API key

**Test Endpoint**: Use production endpoints with test tier (will be provided)

**Recommendations**:
1. Test `/register` with sample dealer
2. Complete payment flow on activation page
3. Submit 2-3 test listings via `/listings`
4. Verify listings appear on https://carlynx.us
5. Test `/status` endpoint
6. Test deactivation via DELETE `/listings`

---

## Support & Contact

**CarLynx Technical Contact**:
- Name: Artur
- Email: support@carlynx.us
- Response Time: Within 24 hours

**Resources**:
- Production Database: https://nusnffvsnhmqxoeqjhjs.supabase.co
- Dealer Portal: https://carlynx.us/dealers
- API Documentation: This document

---

## Security Notes

1. **API Key**: Store securely, never commit to version control
2. **HTTPS Only**: All API calls must use HTTPS
3. **Image URLs**: Must be publicly accessible (no authentication required)
4. **Dealer Data**: Contact info is displayed publicly on active listings
5. **Token**: 16-character alphanumeric, unique per dealer

---

**Last Updated**: January 13, 2025  
**API Version**: 1.0  
**Status**: Production Ready ✅
