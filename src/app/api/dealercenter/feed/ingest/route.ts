import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail, sendImportErrorAlert, sendImportSuccessReport } from '@/lib/emailService'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DEALERCENTER_API_KEY = process.env.DEALERCENTER_API_KEY || ''
const FREE_LISTING_LIMIT = 5 // Free listings for pending dealers

/**
 * POST /api/dealercenter/feed/ingest
 * 
 * Process CSV feed from DealerCenter
 * Handles dealer auto-registration and listing import
 * 
 * Accepts: CSV file upload or raw CSV text
 */

interface DealerCenterCSVRow {
  AccountID?: string
  DCID?: string
  DealerName?: string
  Phone?: string
  Address?: string
  City?: string
  State?: string
  Zip?: string
  StockNumber: string
  VIN?: string
  Year: number
  Make: string  // Maps to brand
  Model: string
  Trim?: string
  Odometer: number  // Maps to mileage
  SpecialPrice: number  // Maps to price
  ExteriorColor?: string
  InteriorColor?: string
  Transmission: string
  PhotoURLs: string  // Pipe-delimited list
  VehicleDescription?: string  // Maps to description
  EquipmentCode?: string
  LatestPhotoModifiedDate?: string
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const startTime = Date.now()
  
  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== DEALERCENTER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    // Parse CSV from request body
    const body = await req.text()
    if (!body || body.trim() === '') {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    // Parse CSV manually (simple implementation)
    const rows = parseCSV(body)
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows found in CSV' },
        { status: 400 }
      )
    }

    console.log(`📊 Processing ${rows.length} rows from CSV feed`)

    // Group listings by dealer (AccountID or DCID)
    const dealerGroups = groupByDealer(rows)
    
    let totalInserted = 0
    let totalUpdated = 0
    let dealersProcessed = 0
    let dealersCreated = 0
    const errors: string[] = []

    // Process each dealer's listings
    for (const [dealerIdentifier, listings] of Object.entries(dealerGroups)) {
      try {
        // Find or create dealer
        const dealer = await findOrCreateDealer(supabase, listings[0])
        
        if (!dealer) {
          errors.push(`Failed to process dealer: ${dealerIdentifier}`)
          continue
        }

        dealersProcessed++
        if (dealer.was_created) {
          dealersCreated++
        }

        // Process listings for this dealer
        const result = await processListingsForDealer(supabase, dealer, listings)
        totalInserted += result.inserted
        totalUpdated += result.updated
        errors.push(...result.errors)

      } catch (error) {
        console.error(`Error processing dealer ${dealerIdentifier}:`, error)
        errors.push(`Dealer ${dealerIdentifier}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const duration = Date.now() - startTime
    const status = errors.length === 0 ? 'success' : (dealersProcessed > 0 ? 'partial' : 'failed')

    // Save log to database
    await supabase.from('dealercenter_import_logs').insert({
      dealers_processed: dealersProcessed,
      dealers_created: dealersCreated,
      listings_inserted: totalInserted,
      listings_updated: totalUpdated,
      total_rows: rows.length,
      errors: errors,
      duration_ms: duration,
      status
    })

    // Send email alerts
    if (errors.length > 0) {
      // Send error alert if there are errors
      await sendImportErrorAlert({
        total_rows: rows.length,
        dealers_processed: dealersProcessed,
        errors: errors.slice(0, 20), // Limit to first 20 errors in email
        timestamp: new Date().toISOString()
      })
    } else if (process.env.SEND_SUCCESS_REPORTS === 'true') {
      // Optional: send success report (disabled by default)
      await sendImportSuccessReport({
        dealers_processed: dealersProcessed,
        dealers_created: dealersCreated,
        listings_inserted: totalInserted,
        listings_updated: totalUpdated,
        total_rows: rows.length,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      dealers_processed: dealersProcessed,
      dealers_created: dealersCreated,
      listings_inserted: totalInserted,
      listings_updated: totalUpdated,
      total_rows: rows.length,
      duration_ms: duration,
      status,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('CSV feed processing error:', error)
    
    // Log critical failure
    await supabase.from('dealercenter_import_logs').insert({
      dealers_processed: 0,
      dealers_created: 0,
      listings_inserted: 0,
      listings_updated: 0,
      total_rows: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration_ms: duration,
      status: 'failed'
    })

    // Send error alert
    await sendImportErrorAlert({
      total_rows: 0,
      dealers_processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Failed to process CSV feed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Simple CSV parser
function parseCSV(csvText: string): DealerCenterCSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: DealerCenterCSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string | number> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Convert numeric fields
    if (row.Year && typeof row.Year === 'string') row.Year = parseInt(row.Year)
    if (row.SpecialPrice && typeof row.SpecialPrice === 'string') row.SpecialPrice = parseFloat(row.SpecialPrice)
    if (row.Odometer && typeof row.Odometer === 'string') row.Odometer = parseInt(row.Odometer)

    rows.push(row as unknown as DealerCenterCSVRow)
  }

  return rows
}

// Group listings by dealer
function groupByDealer(rows: DealerCenterCSVRow[]): Record<string, DealerCenterCSVRow[]> {
  const groups: Record<string, DealerCenterCSVRow[]> = {}
  
  for (const row of rows) {
    const identifier = row.AccountID || row.DCID || 'unknown'
    if (!groups[identifier]) {
      groups[identifier] = []
    }
    groups[identifier].push(row)
  }
  
  return groups
}

// Find or create dealer
async function findOrCreateDealer(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sampleRow: DealerCenterCSVRow
): Promise<{ id: string; activation_token: string; was_created: boolean; subscription_status: string } | null> {
  
  const accountId = sampleRow.AccountID
  const dcid = sampleRow.DCID
  
  if (!accountId && !dcid) {
    console.error('No AccountID or DCID found')
    return null
  }

  // Try to find existing dealer
  let query = supabase.from('dealercenter_dealers').select('id, activation_token, subscription_status, welcome_email_sent')
  
  if (accountId) {
    query = query.eq('dealercenter_account_id', accountId)
  } else if (dcid) {
    query = query.eq('dcid', dcid)
  }

  const { data: existing } = await query.single()

  if (existing) {
    return {
      id: existing.id,
      activation_token: existing.activation_token,
      was_created: false,
      subscription_status: existing.subscription_status
    }
  }

  // Create new dealer
  const activation_token = generateActivationToken()
  
  const { data: newDealer, error } = await supabase
    .from('dealercenter_dealers')
    .insert({
      dealercenter_account_id: accountId || null,
      dcid: dcid || null,
      activation_token,
      dealer_name: sampleRow.DealerName || 'Unknown Dealer',
      contact_email: 'pending@dealercenter.com', // Will be updated
      contact_phone: sampleRow.Phone || null,
      subscription_status: 'pending',
      welcome_email_sent: false
    })
    .select('id, activation_token, subscription_status')
    .single()

  if (error || !newDealer) {
    console.error('Failed to create dealer:', error)
    return null
  }

  // Send welcome email
  if (sampleRow.Phone) {
    await sendWelcomeEmail(
      'pending@dealercenter.com', // TODO: Get real email from DealerCenter
      {
        dealer_name: sampleRow.DealerName || 'Unknown Dealer',
        activation_token,
        free_listings: FREE_LISTING_LIMIT
      }
    )
  }

  console.log(`✅ Created new dealer: ${sampleRow.DealerName} (${accountId || dcid})`)
  console.log(`📧 Activation URL: ${process.env.NEXT_PUBLIC_SITE_URL}/dealers/activate/${activation_token}`)

  return {
    id: newDealer.id,
    activation_token: newDealer.activation_token,
    was_created: true,
    subscription_status: newDealer.subscription_status
  }
}

// Process listings for a dealer
async function processListingsForDealer(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  dealer: { id: string; activation_token: string; subscription_status: string },
  listings: DealerCenterCSVRow[]
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  
  let inserted = 0
  let updated = 0
  const errors: string[] = []
  const currentTime = new Date().toISOString()

  // Check how many active listings dealer has
  const { count: currentCount } = await supabase
    .from('external_listings')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'dealercenter')
    .like('external_id', `DC-${dealer.activation_token}-%`)
    .eq('is_active', true)

  const activeCount = currentCount || 0
  const isPending = dealer.subscription_status === 'pending'
  const availableSlots = isPending ? Math.max(0, FREE_LISTING_LIMIT - activeCount) : 999999

  for (const listing of listings) {
    try {
      // Skip if no available slots for pending dealers
      if (inserted >= availableSlots && isPending) {
        console.log(`⚠️  Skipping listing ${listing.StockNumber} - free limit reached for pending dealer`)
        continue
      }

      const fullExternalId = `DC-${dealer.activation_token}-${listing.StockNumber}`

      // Get state and city IDs
      let stateId = null
      let cityId = null

      if (listing.State) {
        const { data: stateData } = await supabase
          .from('states')
          .select('id')
          .eq('code', listing.State.toUpperCase())
          .single()
        
        stateId = stateData?.id || null

        if (stateId && listing.City) {
          const { data: cityData } = await supabase
            .from('cities')
            .select('id')
            .ilike('name', listing.City)
            .eq('state_id', stateId)
            .single()
          
          cityId = cityData?.id || null
        }
      }

      // Parse image URLs (pipe-delimited list)
      const imageUrls = listing.PhotoURLs 
        ? listing.PhotoURLs.split('|').map(url => url.trim()).filter(url => url.length > 0)
        : []

      // Check if listing exists
      const { data: existing } = await supabase
        .from('external_listings')
        .select('id, views')
        .eq('external_id', fullExternalId)
        .eq('source', 'dealercenter')
        .single()

      const listingData = {
        source: 'dealercenter' as const,
        external_id: fullExternalId,
        title: `${listing.Year} ${listing.Make} ${listing.Model}${listing.Trim ? ' ' + listing.Trim : ''}`,
        year: listing.Year,
        brand: listing.Make,  // Make → brand
        model: listing.Model,
        price: listing.SpecialPrice,  // SpecialPrice → price
        mileage: listing.Odometer,  // Odometer → mileage
        transmission: listing.Transmission,
        vin: listing.VIN || null,  // VIN from CSV
        description: listing.VehicleDescription || null,  // VehicleDescription → description
        image_url: imageUrls[0] || null,
        image_url_2: imageUrls[1] || null,
        image_url_3: imageUrls[2] || null,
        image_url_4: imageUrls[3] || null,
        contact_phone: listing.Phone || null,
        state_id: stateId,
        city_id: cityId,
        city_name: listing.City || null,
        is_active: true,
        last_seen_at: currentTime,
        views: existing?.views || 0
      }

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('external_listings')
          .update(listingData)
          .eq('id', existing.id)

        if (updateError) {
          errors.push(`Failed to update ${listing.StockNumber}: ${updateError.message}`)
        } else {
          updated++
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('external_listings')
          .insert(listingData)

        if (insertError) {
          errors.push(`Failed to insert ${listing.StockNumber}: ${insertError.message}`)
        } else {
          inserted++
        }
      }

    } catch (error) {
      errors.push(`Error processing ${listing.StockNumber}: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  return { inserted, updated, errors }
}

// Generate activation token
function generateActivationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
