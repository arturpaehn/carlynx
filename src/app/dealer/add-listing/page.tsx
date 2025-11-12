'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/components/I18nProvider'
import DealerGuard from '@/components/dealer/DealerGuard'
import ExcelImportModal from '@/components/dealer/ExcelImportModal'

const vehicleTypes = [
  { 
    value: 'car', 
    labelKey: 'carLabel' as const, 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    )
  },
  { 
    value: 'motorcycle', 
    labelKey: 'motorcycleLabel' as const, 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l.95-.95c.18-.18.46-.28.73-.28.55 0 1.02-.22 1.41-.61.39-.39.61-.86.61-1.41 0-.27-.1-.55-.28-.73L19.44 9.03zM7.82 15H5.18C4.8 15 4.5 14.7 4.5 14.32s.3-.68.68-.68h2.64c.38 0 .68.3.68.68S8.2 15 7.82 15zM19 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-.5 4.5h-1v-1h1v1zm0-2h-1v-1h1v1z"/>
      </svg>
    )
  }
]

// Harmful/abusive content keywords
const harmfulKeywords = [
  'fuck','fck','f*ck','f**k','f***','f u c k','motherfucker','motherf*cker','mf','m f','shit','sh*t','sh!t','bullshit','bs','ass','a*s','a**','asses','asshole','assh*le','a**hole','bastard','b*tch','b1tch','b!tch','biatch','bi*ch','dick','d1ck','d!ck','d*ck','dicks','dickhead','d*ckhead','piss','p!ss','p*ss','pissed','crap','damn','hell','cum','c*m','c**','jizz','wank','wanker','w*nker','wankr','slut','sl*t','whore','wh*re','hoe','h*e','bollocks','bugger','tosser','prick','twat','cunt','c*nt','cnt','rapist','perv','pervert','degenerate',
  'porn','p*rn','pr0n','xxx','x-rated','x rated','nsfw','adult only','18+','18 plus','sex','s3x','sexual','hardcore','softcore','fetish','bdsm','bondage','kink','nude','naked','topless','explicit','erotic','erotica','lewd','blowjob','bj','handjob','hj','rimjob','anal','deepthroat','dp','gangbang','camgirl','cam boy','onlyfans','only fans','fansly','escort','call girl','prostitute','sex worker','hooker','incest','stepbro','stepsis','step sister','step brother','milf','gilf','teen sex','barely legal','cumshot','money shot','bukkake','facial','wet dream','sext','sexting','nsfw content',
  'racist','racism','racial superiority','white power','white pride','supremacist','supremacy','alt-right','alt right','far-right','far right','nazi','neo-nazi','neo nazi','third reich','swastika','kkk','ku klux klan','lynch','lynching','go back to your country','islamophobia','antisemitic','anti-semitic','antiblack','anti black','segregation','ethnic cleansing','genocide','n***a','n****r','ch*nk','sp*c','k*ke','g*psy','tr@nny','f*ggot','f*g','d!ngo','p*ki','sand n***a','wetb*ck','w*g','r*tard','ret*rd','mong*loid',
  'kill','killing','killer','murder','murderer','homicide','manslaughter','suicide','self harm','self-harm','selfharm','rape','r*pe','rap3','sexual assault','assault','battery','stab','stabbing','shoot','shooting','mass shooting','open fire','bomb','bombing','explosive','ied','detonate','behead','decapitate','terror','terrorist','terrorism','jihad','martyrdom','abuse','domestic abuse','domestic violence','child abuse','animal abuse','threat','threaten','death threat','die soon','i will kill you','harass','harassment','bully','bullying','dox','doxx','doxing','doxxing',
  'cp','child porn','child pornography','underage','minor sexual','loli','shotacon','shota','pedo','ped0','paedo','paed0','pedophile','groom','grooming',
  'f u c k','s e x','p 0 r n','pr0n','p0rn','h0e','b1tch','d1ck','c* m','c*m','n a z i','k k k','w h o r e','s l u t','r a p e','x x x'
];

// Interface for a single listing
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

export default function DealerAddListingPage() {
  return (
    <DealerGuard>
      <DealerAddListingContent />
    </DealerGuard>
  )
}

function DealerAddListingContent() {
  const router = useRouter()
  const { t } = useTranslation();
  
  // Dealer subscription info
  const [dealerInfo, setDealerInfo] = useState<{
    subscription_status: string
    current_tier_id: string | null
    max_listings: number | null
    active_listings_count: number
  } | null>(null)
  const [loadingDealerInfo, setLoadingDealerInfo] = useState(true)
  
  // Current year for validation
  const [currentYear, setCurrentYear] = useState(2025);
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  // Global data
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [motorcycleBrands, setMotorcycleBrands] = useState<{ id: number; name: string }[]>([])
  const [states, setStates] = useState<{ id: number; code: string; name: string; country_code: string }[]>([])
  
  // Multiple listings state
  const [listings, setListings] = useState<ListingForm[]>([{
    id: Date.now().toString(),
    vehicleType: 'car',
    title: '',
    model: '',
    availableModels: [],
    price: '',
    description: '',
    transmission: '',
    fuelType: '',
    mileage: '',
    vin: '',
    year: '',
    engineSize: '',
    engineSizeWhole: '',
    engineSizeDecimal: '',
    stateId: '',
    cities: [],
    cityInput: '',
    images: [],
    imagePreviews: []
  }])
  
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Excel import modal state
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false)

  // Load dealer subscription info
  useEffect(() => {
    const loadDealerInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoadingDealerInfo(false)
          return
        }

        // Fetch dealer data
        const { data: dealerData } = await supabase
          .from('dealers')
          .select('subscription_status, current_tier_id')
          .eq('user_id', session.user.id)
          .single()

        if (!dealerData) {
          setLoadingDealerInfo(false)
          return
        }

        // Fetch tier info if exists
        let maxListings: number | null = null
        if (dealerData.current_tier_id) {
          const { data: tierData } = await supabase
            .from('subscription_tiers')
            .select('listing_limit')
            .eq('tier_id', dealerData.current_tier_id)
            .single()

          if (tierData) {
            maxListings = tierData.listing_limit
          }
        }

        // Count active listings
        const { count } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_active', true)

        setDealerInfo({
          subscription_status: dealerData.subscription_status,
          current_tier_id: dealerData.current_tier_id,
          max_listings: maxListings,
          active_listings_count: count || 0
        })
      } catch (error) {
        console.error('Error loading dealer info:', error)
      } finally {
        setLoadingDealerInfo(false)
      }
    }

    loadDealerInfo()
  }, [])

  // Load brands, states
  useEffect(() => {
    const loadBrands = async () => {
      const { data, error } = await supabase.from('car_brands').select('id, name')
      if (!error) setBrands(data)
    }

    const loadMotorcycleBrands = async () => {
      const { data, error } = await supabase.from('motorcycle_brands').select('id, name')
      if (!error) setMotorcycleBrands(data)
    }

    const loadStates = async () => {
      const { data, error } = await supabase.from('states').select('id, code, name, country_code')
      if (!error) setStates(data)
    }

    loadBrands()
    loadMotorcycleBrands()
    loadStates()
  }, [])

  // Helper functions for managing listings
  const addNewListing = () => {
    setListings([...listings, {
      id: Date.now().toString(),
      vehicleType: 'car',
      title: '',
      model: '',
      availableModels: [],
      price: '',
      description: '',
      transmission: '',
      fuelType: '',
      mileage: '',
      vin: '',
      year: '',
      engineSize: '',
      engineSizeWhole: '',
      engineSizeDecimal: '',
      stateId: '',
      cities: [],
      cityInput: '',
      images: [],
      imagePreviews: []
    }])
  }

  const removeListing = (id: string) => {
    if (listings.length === 1) {
      setMessage(t('mustHaveAtLeastOne'))
      return
    }
    setListings(listings.filter(l => l.id !== id))
  }

  // Handle Excel import
  const handleExcelImport = (importedListings: ListingForm[]) => {
    // Check dealer limits before adding
    if (dealerInfo) {
      const { subscription_status, max_listings, active_listings_count } = dealerInfo
      
      if (subscription_status !== 'trial' && max_listings !== null) {
        const totalNewListings = active_listings_count + listings.length + importedListings.length
        if (totalNewListings > max_listings) {
          setMessage(`Importing ${importedListings.length} listings would exceed your limit (${max_listings}). Current: ${active_listings_count}, Form: ${listings.length}.`)
          return
        }
      }
    }

    // Append imported listings to current listings
    setListings([...listings, ...importedListings])
    setMessage(`✅ Successfully imported ${importedListings.length} listings. Please review and add images for each listing.`)
  }

  const updateListing = <K extends keyof ListingForm>(id: string, field: K, value: ListingForm[K]) => {
    setListings(prevListings => prevListings.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ))
  }

  // Load cities when state changes for a specific listing
  const loadCitiesForListing = async (listingId: string, stateId: string) => {
    if (!stateId) {
      updateListing(listingId, 'cities', [])
      updateListing(listingId, 'cityInput', '')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, state_id')
        .eq('state_id', parseInt(stateId))
      
      if (!error && data) {
        updateListing(listingId, 'cities', data)
      } else {
        updateListing(listingId, 'cities', [])
      }
      updateListing(listingId, 'cityInput', '')
    } catch {
      updateListing(listingId, 'cities', [])
      updateListing(listingId, 'cityInput', '')
    }
  }

  // Load models when brand changes for a specific listing
  const loadModelsForListing = async (listingId: string, brandName: string, vehicleType: 'car' | 'motorcycle') => {
    const brandList = vehicleType === 'car' ? brands : motorcycleBrands
    const selected = brandList.find((b) => b.name === brandName)
    
    if (!selected) {
      updateListing(listingId, 'availableModels', [])
      return
    }

    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('name')
        .eq('brand_id', selected.id)

      if (!error && data) {
        const unique = Array.from(new Set(data.map((d) => d.name)))
        updateListing(listingId, 'availableModels', unique)
      } else {
        updateListing(listingId, 'availableModels', [])
      }
    } catch {
      updateListing(listingId, 'availableModels', [])
    }
  }

  // DEALER LIMITS: 10 images, 1MB each
  const MAX_IMAGES = 10
  const MAX_IMAGE_SIZE = 1024 * 1024 // 1 MB

  const handleImageChange = (listingId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const listing = listings.find(l => l.id === listingId)
    if (!listing) return

    const supported = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )

    if (supported.length + listing.images.length > MAX_IMAGES) {
      setMessage(t('maxImagesAllowed'))
      return
    }

    const tooLarge = supported.find((file) => file.size > MAX_IMAGE_SIZE)
    if (tooLarge) {
      setMessage(t('imagesTooLarge'))
      return
    }

    const newImages = [...listing.images, ...supported]
    const previews = newImages.map((file) => URL.createObjectURL(file))
    updateListing(listingId, 'images', newImages)
    updateListing(listingId, 'imagePreviews', previews)
  }

  const removeImage = (listingId: string, index: number) => {
    const listing = listings.find(l => l.id === listingId)
    if (!listing) return
    
    const updated = listing.images.filter((_: File, i: number) => i !== index)
    const prevs = updated.map((file: File) => URL.createObjectURL(file))
    updateListing(listingId, 'images', updated)
    updateListing(listingId, 'imagePreviews', prevs)
  }

  // Check harmful keywords - returns the found keyword or null
  const findHarmfulContent = (text: string): string | null => {
    if (!text || text.trim().length === 0) return null
    
    const lower = text.toLowerCase().trim()
    
    // Skip very short inputs (less than 3 chars) to avoid false positives with abbreviations
    if (lower.length < 3) return null
    
    for (const kw of harmfulKeywords) {
      // For very short keywords (2-3 chars), require exact match to avoid false positives
      if (kw.length <= 3 && !kw.includes('*') && !kw.includes(' ')) {
        if (lower === kw) return kw
      } else {
        // For longer keywords, use word boundary matching
        const regex = new RegExp(`\\b${kw.replace(/[*!@]/g, '.')}\\b`, 'i')
        if (regex.test(lower)) return kw
      }
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setMessage('')

    // Check listing limit
    if (dealerInfo) {
      const { subscription_status, max_listings, active_listings_count } = dealerInfo
      
      if (subscription_status !== 'trial' && max_listings !== null) {
        const totalNewListings = active_listings_count + listings.length
        if (totalNewListings > max_listings) {
          setMessage(`${t('adding')} ${listings.length} ${t('listingsWouldExceed')} (${max_listings}). ${t('current')}: ${active_listings_count}.`)
          return
        }
      }
    }

    // Validate all listings
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i]
      const listingNum = i + 1

      // Required fields
      if (!listing.title || !listing.model || !listing.price || !listing.year || 
          !listing.stateId || !listing.transmission || !listing.fuelType) {
        setMessage(`${t('listing')} #${listingNum}: ${t('fillAllRequired')}`)
        return
      }

      // Images
      if (listing.images.length === 0) {
        setMessage(`${t('listing')} #${listingNum}: ${t('pleaseUploadAtLeastOneImage')}`)
        return
      }

      // VIN validation - REQUIRED
      if (!listing.vin || listing.vin.length !== 17) {
        setMessage(`${t('listing')} #${listingNum}: ${t('vinInvalid')}`)
        return
      }

      // Harmful content - check only Description field
      if (listing.description && listing.description.trim().length > 0) {
        const badWord = findHarmfulContent(listing.description)
        if (badWord) {
          console.log(`🚫 Harmful content detected in Description: "${badWord}"`)
          setMessage(`${t('listing')} #${listingNum}: ${t('inappropriateWord')} "${badWord}". ${t('pleaseRemoveIt')}`)
          return
        }
      }

      // Year validation
      const yearNum = parseInt(listing.year)
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        setMessage(`${t('listing')} #${listingNum}: ${t('yearRange')} ${currentYear}.`)
        return
      }

      // Engine size validation
      if (listing.vehicleType === 'motorcycle') {
        if (listing.engineSize) {
          const ccSize = parseInt(listing.engineSize)
          if (isNaN(ccSize) || ccSize < 50 || ccSize > 2500) {
            setMessage(`${t('listing')} #${listingNum}: ${t('invalidEngineSize')}`)
            return
          }
        }
      } else {
        if (listing.engineSizeWhole || listing.engineSizeDecimal) {
          const whole = parseInt(listing.engineSizeWhole) || 0
          const decimal = parseInt(listing.engineSizeDecimal) || 0
          if (whole < 0 || whole > 10 || decimal < 0 || decimal > 9) {
            setMessage(`${t('listing')} #${listingNum}: ${t('invalidEngineSize')}`)
            return
          }
        }
      }
    }

    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setMessage(t('pleaseLogIn'))
        setIsSubmitting(false)
        return
      }

      let successCount = 0

      // Process each listing
      for (const listing of listings) {
        // Calculate engine size
        let engineSizeValue = null
        if (listing.vehicleType === 'motorcycle') {
          engineSizeValue = listing.engineSize ? Number(listing.engineSize) : null
        } else {
          const whole = listing.engineSizeWhole ? Number(listing.engineSizeWhole) : 0
          const decimal = listing.engineSizeDecimal ? Number(listing.engineSizeDecimal) : 0
          if (whole > 0 || decimal > 0) {
            engineSizeValue = whole + decimal / 10
          }
        }

        // Determine city_id and city_name
        let cityIdToSave = null
        let cityNameToSave = listing.cityInput || null
        if (listing.cityInput && listing.cities.length > 0) {
          const match = listing.cities.find(city => city.name === listing.cityInput)
          if (match) {
            cityIdToSave = match.id
            cityNameToSave = match.name
          }
        }

        // Insert listing
        const insertPayload = {
          user_id: session.user.id,
          title: listing.title,
          model: listing.model,
          price: Number(listing.price),
          year: Number(listing.year),
          state_id: parseInt(listing.stateId),
          city_id: cityIdToSave,
          city_name: cityNameToSave,
          description: listing.description || null,
          transmission: listing.transmission,
          fuel_type: listing.fuelType,
          mileage: listing.mileage ? Number(listing.mileage) : null,
          vin: listing.vin || null,
          engine_size: engineSizeValue,
          vehicle_type: listing.vehicleType,
          contact_by_phone: true,
          contact_by_email: true,
          is_active: true,
          created_by_type: 'dealer',
        }
        
        console.log('Inserting listing:', insertPayload)
        
        const { data: insertData, error: insertError } = await supabase
          .from('listings')
          .insert(insertPayload)
          .select()
          .single()

        console.log('Insert result:', { data: insertData, error: insertError })

        if (insertError) {
          console.error('Insert error details:', JSON.stringify(insertError, null, 2))
          setMessage(`${t('failedToCreate')}: ${insertError.message || t('unknownError')}`)
          setIsSubmitting(false)
          return
        }

        const listingId = insertData.id

        // Upload images and insert into listing_images
        for (let i = 0; i < listing.images.length; i++) {
          const file = listing.images[i]
          const fileExt = file.name.split('.').pop()
          const filePath = `listing_${listingId}_${Date.now()}_${i}.${fileExt}`
          
          // Upload to storage (bucket: 'listing-images')
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, file)
          
          if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
          }
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath)
          
          const imageUrl = publicUrlData?.publicUrl
          if (!imageUrl) {
            console.error('Failed to get image URL')
            continue
          }
          
          // Insert into listing_images
          const { error: imgInsertError } = await supabase
            .from('listing_images')
            .insert({
              listing_id: listingId,
              image_url: imageUrl,
              user_id: session.user.id
            })
          
          if (imgInsertError) {
            console.error('Image insert error:', imgInsertError)
          }
        }

        successCount++
      }

      if (successCount === listings.length) {
        // All successful
        router.push('/dealer/my-listings')
      } else if (successCount > 0) {
        // Partial success
        setMessage(`${successCount} ${t('of')} ${listings.length} ${t('listingsCreated')}. ${t('checkAndRetry')}`)
        setIsSubmitting(false)
      } else {
        // All failed
        setMessage(t('failedToCreateListings'))
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage(t('unexpectedError'))
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loadingDealerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Check if dealer can add more listings
  const canAddListing = dealerInfo
    ? dealerInfo.subscription_status === 'trial' ||
      dealerInfo.max_listings === null ||
      dealerInfo.active_listings_count < dealerInfo.max_listings
    : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t('addListing')}</h1>
          <p className="text-xs sm:text-sm text-gray-600">{t('addMultipleVehicles')}</p>
          
          {/* Listing limit info */}
          {dealerInfo && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600">
                {t('active')}: <span className="font-bold">{dealerInfo.active_listings_count}</span>
                {dealerInfo.max_listings !== null && dealerInfo.subscription_status !== 'trial' && (
                  <> / {dealerInfo.max_listings}</>
                )}
                {dealerInfo.subscription_status === 'trial' && (
                  <span className="ml-1 text-green-600 text-xs">({t('unlimitedTrial')})</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Limit reached warning */}
        {!canAddListing && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-sm sm:text-base font-bold text-red-900">{t('limitReached')}</h3>
            </div>
            <p className="text-xs sm:text-sm text-red-800 mb-3">
              {t('maxListingsReached')} ({dealerInfo?.max_listings}). {t('upgradeOrDeactivate')}
            </p>
            <div className="flex gap-2">
              <a
                href="/dealer/subscription"
                className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold hover:bg-red-700 transition"
              >
                {t('upgrade')}
              </a>
              <a
                href="/dealer/my-listings"
                className="bg-white text-red-600 border border-red-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold hover:bg-red-50 transition"
              >
                {t('manage')}
              </a>
            </div>
          </div>
        )}

        {/* Form */}
        {canAddListing && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Render each listing */}
            {listings.map((listing, index) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
                {/* Listing Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    #{index + 1}
                  </h3>
                  {listings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListing(listing.id)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-xs"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('remove')}
                    </button>
                  )}
                </div>

                {/* Single Row Layout - All fields in one line */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {/* Vehicle Type */}
                  <div style={{width: '70px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('vehicleType')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      {vehicleTypes.map((vt) => (
                        <button
                          key={vt.value}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            const newListings = listings.map(l => {
                              if (l.id === listing.id) {
                                return {
                                  ...l,
                                  vehicleType: vt.value as 'car' | 'motorcycle',
                                  title: '',
                                  model: '',
                                  availableModels: [],
                                  engineSize: '',
                                  engineSizeWhole: '',
                                  engineSizeDecimal: ''
                                }
                              }
                              return l
                            })
                            setListings(newListings)
                          }}
                          className={`flex-1 flex items-center justify-center p-1.5 rounded border transition-all ${
                            listing.vehicleType === vt.value
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          title={t(vt.labelKey)}
                        >
                          <span className="flex items-center justify-center">{vt.icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand */}
                  <div style={{width: '140px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('brand')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listing.title}
                      onChange={(e) => {
                        const brandName = e.target.value
                        const newListings = listings.map(l => {
                          if (l.id === listing.id) {
                            return {
                              ...l,
                              title: brandName,
                              model: ''
                            }
                          }
                          return l
                        })
                        setListings(newListings)
                        if (brandName) {
                          loadModelsForListing(listing.id, brandName, listing.vehicleType)
                        }
                      }}
                      required
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      {(listing.vehicleType === 'car' ? brands : motorcycleBrands).map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div style={{width: '140px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('model')} <span className="text-red-500">*</span>
                    </label>
                    {listing.availableModels.length > 0 ? (
                      <select
                        value={listing.model}
                        onChange={(e) => updateListing(listing.id, 'model', e.target.value)}
                        required
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">-</option>
                        {listing.availableModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={listing.model}
                        onChange={(e) => updateListing(listing.id, 'model', e.target.value)}
                        placeholder={t('model')}
                        required
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Year */}
                  <div style={{width: '65px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('year')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={listing.year}
                      onChange={(e) => updateListing(listing.id, 'year', e.target.value)}
                      required
                      min="1900"
                      max={currentYear}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  {/* Price */}
                  <div style={{width: '85px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('price')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={listing.price}
                      onChange={(e) => updateListing(listing.id, 'price', e.target.value)}
                      required
                      min="0"
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  {/* Transmission */}
                  <div style={{width: '80px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('transmission')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listing.transmission}
                      onChange={(e) => updateListing(listing.id, 'transmission', e.target.value)}
                      required
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      <option value="manual">{t('manual')}</option>
                      <option value="automatic">{t('automatic')}</option>
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div style={{width: '90px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('fuelType')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listing.fuelType}
                      onChange={(e) => updateListing(listing.id, 'fuelType', e.target.value)}
                      required
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      {listing.vehicleType === 'motorcycle' ? (
                        <>
                          <option value="gasoline">{t('gasoline')}</option>
                          <option value="electric">{t('electric')}</option>
                        </>
                      ) : (
                        <>
                          <option value="gasoline">{t('gasoline')}</option>
                          <option value="diesel">{t('diesel')}</option>
                          <option value="hybrid">{t('hybrid')}</option>
                          <option value="electric">{t('electric')}</option>
                          <option value="cng">{t('cng')}</option>
                          <option value="lpg">{t('lpg')}</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Mileage */}
                  <div style={{width: '80px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('mileage')}
                    </label>
                    <input
                      type="number"
                      value={listing.mileage}
                      onChange={(e) => updateListing(listing.id, 'mileage', e.target.value)}
                      min="0"
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  {/* VIN */}
                  <div style={{width: '140px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('vin')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={listing.vin}
                      onChange={(e) => updateListing(listing.id, 'vin', e.target.value.toUpperCase())}
                      maxLength={17}
                      required
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent uppercase"
                    />
                  </div>

                  {/* Engine Size */}
                  <div style={{width: '75px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('engineSize')}
                    </label>
                    {listing.vehicleType === 'motorcycle' ? (
                      <input
                        type="number"
                        value={listing.engineSize}
                        onChange={(e) => updateListing(listing.id, 'engineSize', e.target.value)}
                        min="50"
                        max="2500"
                        className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex gap-0.5 items-center">
                        <input
                          type="number"
                          value={listing.engineSizeWhole}
                          onChange={(e) => updateListing(listing.id, 'engineSizeWhole', e.target.value)}
                          min="0"
                          max="10"
                          className="w-1/2 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                        <span className="text-gray-500 text-[10px]">.</span>
                        <input
                          type="number"
                          value={listing.engineSizeDecimal}
                          onChange={(e) => updateListing(listing.id, 'engineSizeDecimal', e.target.value)}
                          min="0"
                          max="9"
                          className="w-1/2 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* State */}
                  <div style={{width: '70px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('state')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listing.stateId}
                      onChange={(e) => {
                        const stateId = e.target.value
                        const newListings = listings.map(l => {
                          if (l.id === listing.id) {
                            return {
                              ...l,
                              stateId: stateId
                            }
                          }
                          return l
                        })
                        setListings(newListings)
                        if (stateId) {
                          loadCitiesForListing(listing.id, stateId)
                        }
                      }}
                      required
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div style={{width: '110px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('city')}
                    </label>
                    <input
                      type="text"
                      value={listing.cityInput}
                      onChange={(e) => updateListing(listing.id, 'cityInput', e.target.value)}
                      placeholder={t('city')}
                      list={`cities-${listing.id}`}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                    <datalist id={`cities-${listing.id}`}>
                      {listing.cities.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  {/* Description */}
                  <div className="flex-1" style={{minWidth: '200px'}}>
                    <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                      {t('description')}
                    </label>
                    <input
                      type="text"
                      value={listing.description}
                      onChange={(e) => updateListing(listing.id, 'description', e.target.value)}
                      placeholder={`${t('optional')}...`}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-0.5">
                    {t('photos')} <span className="text-red-500">*</span>
                    <span className="text-gray-500 font-normal ml-1 text-[10px]">({listing.images.length}/{MAX_IMAGES})</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => handleImageChange(listing.id, e)}
                      className="hidden"
                      id={`photo-upload-${listing.id}`}
                    />
                    <label htmlFor={`photo-upload-${listing.id}`} className="cursor-pointer block text-center">
                      <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-semibold">{t('clickToUpload')}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500">{t('pngJpgWebp')} (1MB {t('max')}, 10 {t('images')})</p>
                    </label>
                  </div>

                  {/* Image previews */}
                  {listing.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-2">
                      {listing.imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <div className="relative w-full h-12 sm:h-14">
                            <Image
                              src={preview}
                              alt={`Preview ${idx + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(listing.id, idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add Another Button */}
              <button
                type="button"
                onClick={addNewListing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 sm:py-2.5 rounded-lg font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('addAnotherListing')}
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => setIsExcelImportOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 sm:py-2.5 rounded-lg font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3.75 3.75 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                Import Excel
              </button>
            </div>

            {/* Error message */}
            {message && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs sm:text-sm">
                {message}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3 sm:py-3.5 rounded-lg font-bold text-sm sm:text-base hover:from-orange-700 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? `${t('creating')} ${listings.length}...` : `${t('submitAllListings')} (${listings.length})`}
            </button>
          </form>
        )}
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImport={handleExcelImport}
        states={states}
      />
    </div>
  )
}
