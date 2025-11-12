'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'

// Import the ListingForm interface from the dealer add-listing page
interface ListingForm {
  id: string
  vehicleType: 'car' | 'motorcycle'
  title: string
  model: string
  availableModels: string[]
  price: string
  description: string
  transmission: string
  fuelType: string
  mileage: string
  vin: string
  year: string
  engineSize: string
  engineSizeWhole: string
  engineSizeDecimal: string
  stateId: string
  cities: { id: number; name: string; state_id: number }[]
  cityInput: string
  images: File[]
  imagePreviews: string[]
}

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (listings: ListingForm[]) => void
  states: { id: number; code: string; name: string; country_code: string }[]
}

interface ExcelRow {
  vehicleType?: string
  title?: string
  model?: string
  price?: string | number
  description?: string
  transmission?: string
  fuelType?: string
  mileage?: string | number
  vin?: string
  year?: string | number
  engineSize?: string | number
  state?: string
  city?: string
}

export default function ExcelImportModal({ isOpen, onClose, onImport, states }: ExcelImportModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<ListingForm[]>([])

  const downloadTemplate = () => {
    // Create template data with sample row
    const templateData = [
      {
        vehicleType: 'car', // car or motorcycle
        title: 'Honda', // ТОЛЬКО МАРКА! НЕ ГОД, НЕ МОДЕЛЬ - только марка для поиска
        model: 'Civic',
        price: 15999,
        description: 'Clean title, well maintained, single owner',
        transmission: 'Automatic', // Manual, Automatic, CVT
        fuelType: 'Gasoline', // Gasoline, Diesel, Electric, Hybrid
        mileage: 45000,
        year: 2020,
        engineSize: '2.0L', // Cars: 2.0L, 3.5L, 5.7L | Motorcycles: 250cc, 600cc, 1000cc
        vin: '1HGBH41JXMN109186', // REQUIRED: 17 characters
        state: 'TX', // State code like TX, CA, FL
        city: 'Houston'
      }
    ]

    // Add instructions row at the top
    const instructionsData = [
      {
        vehicleType: 'INSTRUCTIONS: car or motorcycle',
        title: 'BRAND ONLY! Honda, Toyota, BMW',
        model: 'Model: Civic, Camry, X5',
        price: 'Price in USD: 15999',
        description: 'Vehicle description',
        transmission: 'manual or automatic',
        fuelType: 'gasoline, diesel, hybrid, electric',
        mileage: 'Mileage in miles: 45000',
        year: 'Year: 2020',
        engineSize: 'Cars: 2.0L, 3.5L | Motorcycles: 250cc, 600cc',
        vin: 'REQUIRED: 17 characters',
        state: 'State code: TX, CA, FL',
        city: 'City: Houston'
      },
      ...templateData
    ]

    const ws = XLSX.utils.json_to_sheet(instructionsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Listings Template')
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // vehicleType
      { wch: 30 }, // title
      { wch: 20 }, // model
      { wch: 15 }, // price
      { wch: 40 }, // description
      { wch: 15 }, // transmission
      { wch: 15 }, // fuelType
      { wch: 15 }, // mileage
      { wch: 10 }, // year
      { wch: 25 }, // engineSize
      { wch: 10 }, // state
      { wch: 15 }  // city
    ]

    // Style the instruction row
    if (ws['A1']) {
      ws['A1'].s = { fill: { fgColor: { rgb: 'FFFF00' } }, font: { bold: true } }
    }

    XLSX.writeFile(wb, 'carlynx-listings-template.xlsx')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setErrors([])
    setPreviewData([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]

      if (jsonData.length === 0) {
        setErrors([t('excelFileEmpty')])
        setIsProcessing(false)
        return
      }

      // Validate and convert data
      const validatedListings: ListingForm[] = []
      const validationErrors: string[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const rowNum = i + 2 // +2 because Excel is 1-indexed and we have a header row

        // Skip instruction rows
        const vehicleTypeStr = String(row.vehicleType || '').toLowerCase()
        if (vehicleTypeStr.includes('инструкция') || vehicleTypeStr.includes('instruction') || vehicleTypeStr === '') {
          continue
        }

        try {
          const listing = await validateAndConvertRow(row, rowNum, validationErrors)
          if (listing) {
            validatedListings.push(listing)
          }
        } catch (error) {
          validationErrors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      setPreviewData(validatedListings)
      setErrors(validationErrors)

    } catch (error) {
      setErrors([`${t('failedToParseExcel')}: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }

    setIsProcessing(false)
  }

  const validateAndConvertRow = async (row: ExcelRow, rowNum: number, errors: string[]): Promise<ListingForm | null> => {
    // Required fields validation
    if (!row.vehicleType || !row.title || !row.model || !row.price || !row.year || !row.state || !row.vin) {
      errors.push(`Row ${rowNum}: Missing required fields (vehicleType, title, model, price, year, state, vin)`)
      return null
    }

    // VIN validation - REQUIRED, exactly 17 characters
    const vinStr = String(row.vin).trim().toUpperCase()
    if (vinStr.length !== 17) {
      errors.push(`Row ${rowNum}: VIN must be exactly 17 characters`)
      return null
    }

    // Vehicle type validation
    const vehicleType = row.vehicleType.toLowerCase()
    if (vehicleType !== 'car' && vehicleType !== 'motorcycle') {
      errors.push(`Row ${rowNum}: Vehicle type must be 'car' or 'motorcycle'`)
      return null
    }

    // State validation
    const stateCode = String(row.state).toUpperCase()
    const state = states.find(s => s.code === stateCode)
    if (!state) {
      errors.push(`Row ${rowNum}: Invalid state code '${stateCode}'`)
      return null
    }

    // Price validation
    const price = Number(row.price)
    if (isNaN(price) || price <= 0) {
      errors.push(`Row ${rowNum}: Invalid price`)
      return null
    }

    // Year validation
    const year = Number(row.year)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear) {
      errors.push(`Row ${rowNum}: Invalid year (must be between 1900 and ${currentYear})`)
      return null
    }

    // Mileage validation (optional)
    let mileageStr = ''
    if (row.mileage) {
      const mileage = Number(row.mileage)
      if (isNaN(mileage) || mileage < 0) {
        errors.push(`Row ${rowNum}: Invalid mileage`)
        return null
      }
      mileageStr = String(mileage)
    }

    // Engine size validation - handle different formats for cars and motorcycles
    let engineSizeStr = ''
    if (row.engineSize) {
      const normalizeEngineSize = (size: string | number, vehicleType: string): string => {
        let sizeStr = String(size).toLowerCase().trim()
        
        // Replace comma with dot for decimal separator
        sizeStr = sizeStr.replace(',', '.')
        
        // Remove common suffixes and spaces
        sizeStr = sizeStr.replace(/cc|l|liters?|litres?|\s/g, '').trim()
        
        const sizeNum = parseFloat(sizeStr)
        
        if (vehicleType === 'motorcycle') {
          // For motorcycles: return CC as number only
          let ccValue: number
          
          // If it's a decimal (like 1.2, 0.6), assume it's in liters
          if (sizeNum > 0 && sizeNum < 10) {
            ccValue = Math.round(sizeNum * 1000)
          } else {
            ccValue = sizeNum
          }
          
          if (isNaN(ccValue) || ccValue < 50 || ccValue > 2500) {
            throw new Error(`Invalid motorcycle engine size. Expected: 50-2500cc or 0.05-2.5L. Got: "${size}"`)
          }
          
          return String(ccValue)
        } else {
          // For cars: return liters as decimal number only (no 'L' suffix)
          let literValue: number
          
          // If it's a large number (>10), assume it's in CC
          if (sizeNum >= 10) {
            literValue = sizeNum / 1000
          } else {
            literValue = sizeNum
          }
          
          if (isNaN(literValue) || literValue < 0.5 || literValue > 12) {
            throw new Error(`Invalid car engine size. Expected: 0.5-12.0L or 500-12000cc. Got: "${size}"`)
          }
          
          return literValue.toFixed(1)
        }
      }
      
      try {
        engineSizeStr = normalizeEngineSize(row.engineSize, vehicleType)
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Invalid engine size'}`)
        return null
      }
    }

    // Normalize transmission and fuel type values to match form options
    const normalizeTransmission = (transmission: string): string => {
      const normalized = transmission.toLowerCase().trim()
      if (normalized === 'manual' || normalized === 'stick' || normalized === 'mt') return 'manual'
      if (normalized === 'automatic' || normalized === 'auto' || normalized === 'at') return 'automatic'
      return ''
    }

    const normalizeFuelType = (fuelType: string): string => {
      const normalized = fuelType.toLowerCase().trim()
      if (normalized === 'gasoline' || normalized === 'gas' || normalized === 'petrol') return 'gasoline'
      if (normalized === 'diesel') return 'diesel'
      if (normalized === 'hybrid') return 'hybrid'
      if (normalized === 'electric' || normalized === 'ev') return 'electric'
      if (normalized === 'cng') return 'cng'
      if (normalized === 'lpg') return 'lpg'
      return ''
    }

    // Split engine size into whole and decimal parts for form compatibility
    let engineSizeWhole = ''
    let engineSizeDecimal = ''
    
    if (engineSizeStr && vehicleType === 'car') {
      const engineFloat = parseFloat(engineSizeStr)
      if (!isNaN(engineFloat)) {
        engineSizeWhole = Math.floor(engineFloat).toString()
        const decimal = engineFloat - Math.floor(engineFloat)
        // Always set decimal part, even if it's 0 (for 2.0 → whole="2", decimal="0")
        engineSizeDecimal = Math.round(decimal * 10).toString()
      }
    }

    // Create listing form object
    const listing: ListingForm = {
      id: `excel-${Date.now()}-${rowNum}`,
      vehicleType: vehicleType as 'car' | 'motorcycle',
      title: String(row.title),
      model: String(row.model),
      availableModels: [],
      price: String(price),
      description: row.description ? String(row.description) : '',
      transmission: row.transmission ? normalizeTransmission(String(row.transmission)) : '',
      fuelType: row.fuelType ? normalizeFuelType(String(row.fuelType)) : '',
      mileage: mileageStr,
      vin: vinStr,
      year: String(year),
      engineSize: engineSizeStr,
      engineSizeWhole: engineSizeWhole,
      engineSizeDecimal: engineSizeDecimal,
      stateId: String(state.id),
      cities: [],
      cityInput: row.city ? String(row.city) : '',
      images: [],
      imagePreviews: []
    }

    return listing
  }

  const handleImport = () => {
    if (previewData.length === 0) {
      setErrors([t('noValidListingsToImport')])
      return
    }

    onImport(previewData)
    onClose()
    
    // Reset state
    setPreviewData([])
    setErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    onClose()
    setPreviewData([])
    setErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t('importExcelListings')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template Download */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">{t('downloadTemplate')}</h3>
          <p className="text-sm text-blue-600 mb-3">{t('downloadTemplateDescription')}</p>
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            📥 {t('downloadExcelTemplate')}
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectExcelFile')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            disabled={isProcessing}
          />
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">{t('processingExcelFile')}...</p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">{t('validationErrors')}:</h4>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">
              {t('previewListings')} ({previewData.length} {t('validListings')})
            </h4>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">{t('type')}</th>
                    <th className="px-2 py-2 text-left">{t('title')}</th>
                    <th className="px-2 py-2 text-left">{t('model')}</th>
                    <th className="px-2 py-2 text-left">{t('year')}</th>
                    <th className="px-2 py-2 text-left">{t('price')}</th>
                    <th className="px-2 py-2 text-left">{t('state')}</th>
                    <th className="px-2 py-2 text-left">{t('city')}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((listing, index) => {
                    const state = states.find(s => s.id === parseInt(listing.stateId))
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-2">{listing.vehicleType}</td>
                        <td className="px-2 py-2 max-w-[150px] truncate">{listing.title}</td>
                        <td className="px-2 py-2">{listing.model}</td>
                        <td className="px-2 py-2">{listing.year}</td>
                        <td className="px-2 py-2">${listing.price}</td>
                        <td className="px-2 py-2">{state?.code}</td>
                        <td className="px-2 py-2">{listing.cityInput}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          {previewData.length > 0 && (
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              {t('importListings')} ({previewData.length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}