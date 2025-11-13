/**
 * VIN Decoder Utility
 * Uses NHTSA vPIC API to decode VIN and auto-fill vehicle information
 * API Documentation: https://vpic.nhtsa.dot.gov/api/
 */

export interface VINDecodedData {
  Make: string | null
  Model: string | null
  ModelYear: string | null
  BodyClass: string | null
  EngineNumberOfCylinders: string | null
  DisplacementL: string | null
  DisplacementCC: string | null
  DriveType: string | null
  TransmissionStyle: string | null
  FuelTypePrimary: string | null
  VehicleType: string | null
}

export interface VINDecodeResult {
  success: boolean
  data?: VINDecodedData
  error?: string
}

/**
 * Decode VIN using NHTSA vPIC API
 * @param vin - 17-character VIN
 * @returns Decoded vehicle data or error
 */
export async function decodeVIN(vin: string): Promise<VINDecodeResult> {
  // Validate VIN format
  if (!vin || vin.length !== 17) {
    return {
      success: false,
      error: 'VIN must be exactly 17 characters'
    }
  }

  // Clean VIN (uppercase, remove spaces)
  const cleanVIN = vin.trim().toUpperCase().replace(/\s/g, '')

  try {
    // Call NHTSA vPIC API
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVIN}?format=json`
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()

    // Check if API returned results
    if (!result.Results || result.Results.length === 0) {
      return {
        success: false,
        error: 'No data found for this VIN'
      }
    }

    const vehicleData = result.Results[0]

    // Check if VIN is valid
    if (vehicleData.ErrorCode && vehicleData.ErrorCode !== '0') {
      // Provide more helpful error messages based on error code
      let errorMessage = vehicleData.ErrorText || 'Invalid VIN'
      
      if (vehicleData.ErrorCode === '8' || errorMessage.includes('No detailed data')) {
        errorMessage = 'VIN is valid but detailed vehicle data is not available in NHTSA database. Please fill form manually.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }

    // Check if we have meaningful data (at least Make or Model)
    if (!vehicleData.Make && !vehicleData.Model) {
      return {
        success: false,
        error: 'VIN decoded but no vehicle details found. Please enter information manually.'
      }
    }

    // Extract relevant fields
    const decodedData: VINDecodedData = {
      Make: vehicleData.Make || null,
      Model: vehicleData.Model || null,
      ModelYear: vehicleData.ModelYear || null,
      BodyClass: vehicleData.BodyClass || null,
      EngineNumberOfCylinders: vehicleData.EngineNumberOfCylinders || null,
      DisplacementL: vehicleData.DisplacementL || null,
      DisplacementCC: vehicleData.DisplacementCC || null,
      DriveType: vehicleData.DriveType || null,
      TransmissionStyle: vehicleData.TransmissionStyle || null,
      FuelTypePrimary: vehicleData.FuelTypePrimary || null,
      VehicleType: vehicleData.VehicleType || null
    }

    return {
      success: true,
      data: decodedData
    }
  } catch (error) {
    console.error('VIN decode error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode VIN'
    }
  }
}

/**
 * Map NHTSA fuel type to our app's fuel type options
 */
export function mapFuelType(nhtساFuelType: string | null): string {
  if (!nhtساFuelType) return ''
  
  const fuelType = nhtساFuelType.toLowerCase()
  
  if (fuelType.includes('gasoline') || fuelType.includes('gas')) return 'gasoline'
  if (fuelType.includes('diesel')) return 'diesel'
  if (fuelType.includes('electric') || fuelType.includes('ev')) return 'electric'
  if (fuelType.includes('hybrid')) return 'hybrid'
  if (fuelType.includes('cng') || fuelType.includes('natural gas')) return 'cng'
  if (fuelType.includes('lpg') || fuelType.includes('propane')) return 'lpg'
  
  return ''
}

/**
 * Map NHTSA transmission style to our app's transmission options
 */
export function mapTransmission(nhtsaTransmission: string | null): string {
  if (!nhtsaTransmission) return ''
  
  const transmission = nhtsaTransmission.toLowerCase()
  
  if (transmission.includes('manual')) return 'manual'
  if (transmission.includes('automatic') || transmission.includes('auto')) return 'automatic'
  
  return ''
}

/**
 * Determine vehicle type (car or motorcycle) from NHTSA data
 */
export function determineVehicleType(vehicleType: string | null, bodyClass: string | null): 'car' | 'motorcycle' {
  const vType = vehicleType?.toLowerCase() || ''
  const bClass = bodyClass?.toLowerCase() || ''
  
  if (vType.includes('motorcycle') || vType.includes('bike') || bClass.includes('motorcycle')) {
    return 'motorcycle'
  }
  
  return 'car'
}

/**
 * Parse engine displacement for display
 * For cars: returns {whole: number, decimal: number} for liters
 * For motorcycles: returns {cc: number} for cubic centimeters
 */
export function parseEngineSize(
  displacementL: string | null,
  displacementCC: string | null,
  vehicleType: 'car' | 'motorcycle'
): { whole?: string; decimal?: string; cc?: string } {
  if (vehicleType === 'motorcycle') {
    // For motorcycles, prefer CC
    if (displacementCC) {
      const cc = parseFloat(displacementCC)
      if (!isNaN(cc)) {
        return { cc: Math.round(cc).toString() }
      }
    }
    // Fallback: convert L to CC
    if (displacementL) {
      const liters = parseFloat(displacementL)
      if (!isNaN(liters)) {
        return { cc: Math.round(liters * 1000).toString() }
      }
    }
  } else {
    // For cars, use Liters
    if (displacementL) {
      const liters = parseFloat(displacementL)
      if (!isNaN(liters)) {
        const whole = Math.floor(liters)
        const decimal = Math.round((liters - whole) * 10)
        return {
          whole: whole.toString(),
          decimal: decimal.toString()
        }
      }
    }
    // Fallback: convert CC to L
    if (displacementCC) {
      const cc = parseFloat(displacementCC)
      if (!isNaN(cc)) {
        const liters = cc / 1000
        const whole = Math.floor(liters)
        const decimal = Math.round((liters - whole) * 10)
        return {
          whole: whole.toString(),
          decimal: decimal.toString()
        }
      }
    }
  }
  
  return {}
}
