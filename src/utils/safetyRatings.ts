// NHTSA Safety Ratings API Integration
// API Documentation: https://api.nhtsa.gov/SafetyRatings

export interface SafetyRating {
  overallRating: number | null
  overallFrontCrashRating: number | null
  overallSideCrashRating: number | null
  rolloverRating: number | null
  vehicleId?: number
}

interface NHTSAVehicleResult {
  VehicleId: number
  VehicleDescription?: string
  OverallRating?: string
}

interface NHTSARatingDetails {
  OverallRating?: string
  OverallFrontCrashRating?: string
  OverallSideCrashRating?: string
  RolloverRating?: string
}

/**
 * Fetch NHTSA Safety Ratings for a vehicle
 * @param year - Vehicle year (e.g., 2016)
 * @param make - Vehicle make/brand (e.g., "Ford")
 * @param model - Vehicle model (e.g., "Explorer")
 * @returns SafetyRating object or null if not available
 */
export async function fetchSafetyRating(
  year: number,
  make: string | null,
  model: string | null
): Promise<SafetyRating | null> {
  // Validate inputs
  if (!year || !make || !model) {
    console.log('Safety Rating: Missing required parameters (year, make, or model)')
    return null
  }

  // Only fetch for vehicles 2011 and newer (NHTSA started 5-star ratings in 2011)
  if (year < 2011) {
    console.log(`Safety Rating: Year ${year} is too old. NHTSA 5-star ratings available from 2011+`)
    return null
  }

  try {
    // Step 1: Get list of tested vehicles for this year/make/model
    const searchUrl = `https://api.nhtsa.gov/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`
    console.log('Fetching safety ratings from:', searchUrl)

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      console.error('Safety Rating API search failed:', searchResponse.status)
      return null
    }

    const searchData = await searchResponse.json()
    const results: NHTSAVehicleResult[] = searchData.Results || []

    if (results.length === 0) {
      console.log(`No safety rating data found for ${year} ${make} ${model}`)
      return null
    }

    // Step 2: Get the first VehicleId (usually the most common trim)
    const vehicleId = results[0].VehicleId
    console.log(`Found VehicleId: ${vehicleId} for ${year} ${make} ${model}`)

    // Step 3: Fetch detailed ratings for this VehicleId
    const detailsUrl = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}?format=json`
    const detailsResponse = await fetch(detailsUrl)
    
    if (!detailsResponse.ok) {
      console.error('Safety Rating API details failed:', detailsResponse.status)
      return null
    }

    const detailsData = await detailsResponse.json()
    const ratingDetails: NHTSARatingDetails = detailsData.Results?.[0] || {}

    // Parse ratings (convert strings to numbers, handle "Not Rated")
    const parseRating = (ratingStr: string | undefined): number | null => {
      if (!ratingStr || ratingStr === 'Not Rated' || ratingStr === '') return null
      const num = parseInt(ratingStr, 10)
      return isNaN(num) ? null : num
    }

    const safetyRating: SafetyRating = {
      overallRating: parseRating(ratingDetails.OverallRating),
      overallFrontCrashRating: parseRating(ratingDetails.OverallFrontCrashRating),
      overallSideCrashRating: parseRating(ratingDetails.OverallSideCrashRating),
      rolloverRating: parseRating(ratingDetails.RolloverRating),
      vehicleId
    }

    console.log('Safety Rating fetched:', safetyRating)
    return safetyRating

  } catch (error) {
    console.error('Error fetching safety rating:', error)
    return null
  }
}

/**
 * Calculate average safety rating from individual ratings
 * @param rating - SafetyRating object
 * @returns Average rating (0-5) or null
 */
export function calculateAverageRating(rating: SafetyRating): number | null {
  const ratings = [
    rating.overallFrontCrashRating,
    rating.overallSideCrashRating,
    rating.rolloverRating
  ].filter((r): r is number => r !== null)

  if (ratings.length === 0) return rating.overallRating

  const sum = ratings.reduce((acc, r) => acc + r, 0)
  return Math.round((sum / ratings.length) * 10) / 10 // Round to 1 decimal
}

/**
 * Render star rating display (for UI)
 * @param rating - Number between 0-5
 * @returns String of star emojis
 */
export function renderStars(rating: number | null): string {
  if (rating === null) return '☆☆☆☆☆'
  
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return '⭐'.repeat(fullStars) + 
         (hasHalfStar ? '⭐' : '') + // Using full star for simplicity
         '☆'.repeat(emptyStars)
}
