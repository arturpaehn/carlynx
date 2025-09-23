'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const fuelOptions = ['gasoline', 'diesel', 'hybrid', 'electric', 'cng', 'lpg']
const motorcycleFuelOptions = ['gasoline', 'electric']
const transmissionOptions = ['manual', 'automatic']
const vehicleTypes = [
  { 
    value: 'car', 
    label: 'Car', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    )
  },
  { 
    value: 'motorcycle', 
    label: 'Motorcycle', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l.95-.95c.18-.18.46-.28.73-.28.55 0 1.02-.22 1.41-.61.39-.39.61-.86.61-1.41 0-.27-.1-.55-.28-.73L19.44 9.03zM7.82 15H5.18C4.8 15 4.5 14.7 4.5 14.32s.3-.68.68-.68h2.64c.38 0 .68.3.68.68S8.2 15 7.82 15zM19 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-.5 4.5h-1v-1h1v1zm0-2h-1v-1h1v1z"/>
      </svg>
    )
  }
]
const currentYear = new Date().getFullYear()

// --- Harmful/abusive content keywords ---
const harmfulKeywords = [
  // Profanity / Swearing
  'fuck','fck','f*ck','f**k','f***','f u c k','motherfucker','motherf*cker','mf','m f','shit','sh*t','sh!t','bullshit','bs','ass','a*s','a**','asses','asshole','assh*le','a**hole','bastard','b*tch','b1tch','b!tch','biatch','bi*ch','dick','d1ck','d!ck','d*ck','dicks','dickhead','d*ckhead','piss','p!ss','p*ss','pissed','crap','damn','hell','cum','c*m','c**','jizz','wank','wanker','w*nker','wankr','slut','sl*t','whore','wh*re','hoe','h*e','bollocks','bugger','tosser','prick','twat','cunt','c*nt','cnt','rapist','perv','pervert','degenerate',
  // Sexual / Pornographic
  'porn','p*rn','pr0n','xxx','x-rated','x rated','nsfw','adult only','18+','18 plus','sex','s3x','sexual','hardcore','softcore','fetish','bdsm','bondage','kink','nude','naked','topless','explicit','erotic','erotica','lewd','blowjob','bj','handjob','hj','rimjob','anal','deepthroat','dp','gangbang','camgirl','cam boy','onlyfans','only fans','fansly','escort','call girl','prostitute','sex worker','hooker','incest','stepbro','stepsis','step sister','step brother','milf','gilf','teen sex','barely legal','cumshot','money shot','bukkake','facial','wet dream','sext','sexting','nsfw content',
  // Hate / Racism / Extremism
  'racist','racism','racial superiority','white power','white pride','supremacist','supremacy','alt-right','alt right','far-right','far right','nazi','neo-nazi','neo nazi','third reich','swastika','kkk','ku klux klan','lynch','lynching','go back to your country','islamophobia','antisemitic','anti-semitic','antiblack','anti black','segregation','ethnic cleansing','genocide','n***a','n****r','ch*nk','sp*c','k*ke','g*psy','tr@nny','f*ggot','f*g','d!ngo','p*ki','sand n***a','wetb*ck','w*g','r*tard','ret*rd','mong*loid',
  // Violence / Threats
  'kill','killing','killer','murder','murderer','homicide','manslaughter','suicide','self harm','self-harm','selfharm','rape','r*pe','rap3','sexual assault','assault','battery','stab','stabbing','shoot','shooting','mass shooting','open fire','bomb','bombing','explosive','ied','detonate','behead','decapitate','terror','terrorist','terrorism','jihad','martyrdom','abuse','domestic abuse','domestic violence','child abuse','animal abuse','threat','threaten','death threat','die soon','i will kill you','harass','harassment','bully','bullying','dox','doxx','doxing','doxxing',
  // Grooming / Minors
  'cp','child porn','child pornography','underage','minor sexual','loli','shotacon','shota','pedo','ped0','paedo','paed0','pedophile','groom','grooming',
  // Evasions / Obfuscations
  'f u c k','s e x','p 0 r n','pr0n','p0rn','h0e','b1tch','d1ck','c* m','c*m','n a z i','k k k','w h o r e','s l u t','r a p e','x x x'
];

export default function AddListingPage() {
  const userProfile = useUser();
  const router = useRouter()
  
  // Новое состояние для типа транспорта
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car')
  
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [motorcycleBrands, setMotorcycleBrands] = useState<{ id: number; name: string }[]>([])
  // States и stateId для выбора штата
  const [states, setStates] = useState<{ id: number; code: string; name: string; country_code: string }[]>([])
  const [stateId, setStateId] = useState('')
  // Города и выбранный/введённый город
  const [cities, setCities] = useState<{ id: number; name: string; state_id: number }[]>([])
  const [cityInput, setCityInput] = useState('') // строка для input


  const [title, setTitle] = useState('')
  const [model, setModel] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [price, setPrice] = useState('')
  // Используем stateId вместо location
  const [description, setDescription] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileage, setMileage] = useState('')
  const [year, setYear] = useState('')
  // Новое поле для мотоциклов - объём двигателя
  const [engineSize, setEngineSize] = useState('')
  const [engineSizeWhole, setEngineSizeWhole] = useState('')
  const [engineSizeDecimal, setEngineSizeDecimal] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const [contactByPhone, setContactByPhone] = useState(true)
  const [contactByEmail, setContactByEmail] = useState(false)

  // Новые состояния для модального окна
  const [showAgreement, setShowAgreement] = useState(false)
  const [agreementChecked, setAgreementChecked] = useState(false)
  
  // Состояние загрузки для предотвращения двойной отправки
  const [isSubmitting, setIsSubmitting] = useState(false)

  // useUser уже возвращает профиль или null, отдельная проверка не нужна

  useEffect(() => {
    const loadBrands = async () => {
      const { data, error } = await supabase.from('car_brands').select('id, name')
      if (!error) setBrands(data)
    }

    const loadMotorcycleBrands = async () => {
      const { data, error } = await supabase.from('motorcycle_brands').select('id, name')
      if (!error) setMotorcycleBrands(data)
    }

    // Загружаем список штатов США и Мексики
    const loadStates = async () => {
      console.log('Loading states...')
      const { data, error } = await supabase.from('states').select('id, code, name, country_code')
      if (!error) {
        console.log('States loaded:', data?.length)
        setStates(data)
      } else {
        console.error('Error loading states:', error)
      }
    }

    loadBrands()
    loadMotorcycleBrands()
    loadStates()
  }, [])

  // Загружаем города при выборе штата
  useEffect(() => {
    if (!stateId) {
      setCities([])
      setCityInput('')
      return;
    }
    
    let cancelled = false; // Флаг для предотвращения состояния гонки
    
    const loadCities = async () => {
      try {
        console.log('Loading cities for state:', stateId)
        const { data, error } = await supabase.from('cities').select('id, name, state_id').eq('state_id', stateId)
        
        // Проверяем, не был ли этот запрос отменен
        if (cancelled) return;
        
        if (!error && data) {
          console.log('Cities loaded:', data.length)
          setCities(data)
        } else {
          console.error('Error loading cities:', error)
          setCities([])
        }
        setCityInput('')
      } catch (err) {
        // Проверяем, не был ли этот запрос отменен
        if (cancelled) return;
        
        console.error('Failed to load cities:', err)
        setCities([])
        setCityInput('')
      }
    }
    
    loadCities()
    
    // Cleanup функция для предотвращения состояния гонки
    return () => {
      cancelled = true;
    }
  }, [stateId])

  useEffect(() => {
    const selected = brands.find((b) => b.name === title)
    if (!selected) return setAvailableModels([])

    let cancelled = false; // Флаг для предотвращения состояния гонки

    const loadModels = async () => {
      try {
        const { data, error } = await supabase
          .from('car_models')
          .select('name')
          .eq('brand_id', selected.id)

        // Проверяем, не был ли этот запрос отменен
        if (cancelled) return;

        if (!error && data) {
          const unique = Array.from(new Set(data.map((d) => d.name)))
          setAvailableModels(unique)
        } else {
          console.error('Error loading models:', error)
          setAvailableModels([])
        }
      } catch (err) {
        // Проверяем, не был ли этот запрос отменен
        if (cancelled) return;
        
        console.error('Failed to load models:', err)
        setAvailableModels([])
      }
    }

    loadModels()
    
    // Cleanup функция для предотвращения состояния гонки
    return () => {
      cancelled = true;
    }
  }, [title, brands])

  const MAX_IMAGES = 4;
  const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const supported = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );
    if (supported.length + images.length > MAX_IMAGES) {
      setMessage(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const tooLarge = supported.find((file) => file.size > MAX_IMAGE_SIZE);
    if (tooLarge) {
      setMessage('One or more images are too large (max 500 KB each).');
      return;
    }
    const newImages = [...images, ...supported];
    const previews = newImages.map((file) => URL.createObjectURL(file));
    setImages(newImages);
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Вынесенная функция для реального добавления объявления (теперь с state_id, city_id/city_name)
  // Основная логика добавления объявления
  const realAddListing = async () => {
    try {
      if (!userProfile || !('user_id' in userProfile) || !userProfile.user_id) {
        throw new Error('Authentication failed.');
      }
    // Определяем city_id и city_name
    let cityIdToSave = null;
    let cityNameToSave = cityInput || null;
    if (cityInput && cities.length > 0) {
      const match = cities.find(city => city.name === cityInput);
      if (match) {
        cityIdToSave = match.id;
        cityNameToSave = match.name;
      }
    }
    // 1. Создаём объявление
    const { data: insertData, error: insertError } = await supabase.from('listings').insert([
      {
        user_id: userProfile.user_id,
        title: title,
        model: model || null,
        price: Number(price),
        year: Number(year),
        state_id: stateId,
        city_id: cityIdToSave,
        city_name: cityNameToSave,
        transmission: vehicleType === 'car' ? (transmission || null) : null,
        fuel_type: fuelType || null,
        mileage: mileage ? Number(mileage) : null,
        description: description || null,
        contact_by_phone: contactByPhone,
        contact_by_email: contactByEmail,
        is_active: true,
        views: 0,
        vehicle_type: vehicleType,
        engine_size: (() => {
          if (vehicleType === 'motorcycle') {
            return engineSize ? Number(engineSize) : null;
          } else {
            // Машины: собираем из двух полей и конвертируем в cc
            if (engineSizeWhole || engineSizeDecimal) {
              const whole = engineSizeWhole ? Number(engineSizeWhole) : 0;
              const decimal = engineSizeDecimal ? Number(engineSizeDecimal) : 0;
              const totalLiters = whole + (decimal / 10);
              return Math.round(totalLiters * 1000); // конвертируем в cc
            }
            return null;
          }
        })()
      }
    ]).select('id').single();
    if (insertError || !insertData?.id) {
      throw new Error('Listing submission failed: ' + (insertError?.message || 'No ID'));
    }
    const listingId = insertData.id;
    // 2. Загружаем картинки и добавляем записи в listing_images
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `listing_${listingId}_${Date.now()}_${i}.${fileExt}`;
      // upload to storage (bucket: 'listing-images')
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(filePath, file);
      if (uploadError) {
        throw new Error('Listing submission failed: ' + uploadError.message);
      }
      // get public url
      const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) {
        throw new Error('Listing submission failed: Failed to get image URL');
      }
      // insert into listing_images
      const { error: imgInsertError } = await supabase.from('listing_images').insert([
        {
          listing_id: listingId,
          image_url: imageUrl,
          user_id: userProfile.user_id
        }
      ]);
      if (imgInsertError) {
        throw new Error('Listing submission failed: ' + imgInsertError.message);
      }
    }
    setShowAgreement(false);
    setAgreementChecked(false);
    
    // Сброс всех состояний формы для следующего использования
    setVehicleType('car');
    setTitle('');
    setModel('');
    setAvailableModels([]);
    setPrice('');
    setDescription('');
    setTransmission('');
    setFuelType('');
    setMileage('');
    setYear('');
    setEngineSize('');
    setEngineSizeWhole('');
    setEngineSizeDecimal('');
    setImages([]);
    setImagePreviews([]);
    setStateId('');
    setCities([]);
    setCityInput('');
    setContactByPhone(true);
    setContactByEmail(false);
    setMessage('');
    
    router.push('/my-listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      setMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      setShowAgreement(false);
      setAgreementChecked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Проверка блокировки пользователя (после всех хуков)
  if (userProfile && 'is_blocked' in userProfile && userProfile.is_blocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center pt-header">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95 border border-red-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Blocked</h3>
            <p className="text-red-600 font-medium">You are blocked due to a violation of the platform policy. Access denied.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверки до показа модалки
    if (!title || !year || !stateId || !price || !vehicleType) {
      setMessage('Please fill in all required fields.');
      return;
    }
    
    // Vehicle-specific validation
    if (vehicleType === 'car' && !transmission) {
      setMessage('Please select transmission for car.');
      return;
    }
    
    if (images.length === 0) {
      setMessage('Please upload at least one image.');
      return;
    }
    if (!contactByPhone && !contactByEmail) {
      setMessage('Please select at least one contact method.');
      return;
    }
    const numericYear = Number(year);
    if (isNaN(numericYear) || numericYear < 1900 || numericYear > currentYear) {
      setMessage(`Year must be between 1900 and ${currentYear}.`);
      return;
    }
    
    // Engine size validation (optional but if provided should be valid)
    if (vehicleType === 'motorcycle') {
      if (engineSize) {
        const numericEngineSize = Number(engineSize);
        if (isNaN(numericEngineSize) || numericEngineSize < 50 || numericEngineSize > 3000) {
          setMessage('Engine size must be between 50 and 3000 cc for motorcycles.');
          return;
        }
      }
    } else {
      // Машины: проверяем отдельные поля
      if (engineSizeWhole || engineSizeDecimal) {
        const whole = engineSizeWhole ? Number(engineSizeWhole) : 0;
        const decimal = engineSizeDecimal ? Number(engineSizeDecimal) : 0;
        
        if (isNaN(whole) || isNaN(decimal) || whole < 0 || whole > 9 || decimal < 0 || decimal > 9) {
          setMessage('Invalid engine size format for cars.');
          return;
        }
        
        const totalLiters = whole + (decimal / 10);
        if (totalLiters < 0.5 || totalLiters > 10.0) {
          setMessage('Engine size must be between 0.5 and 10.0 liters for cars.');
          return;
        }
      }
    }
    // --- Harmful content check ---
    const desc = description.toLowerCase();
    if (harmfulKeywords.some(word => desc.includes(word))) {
      if (userProfile && 'user_id' in userProfile && userProfile.user_id) {
        await supabase.rpc('increment_abuse_attempts', { user_id_param: userProfile.user_id });
      }
      setMessage('🚫 Your listing contains words or phrases that are not allowed on Carlynx (profanity, hate, sexual, or violent content). Please remove any inappropriate language and try again. Repeated attempts may result in account restrictions.');
      return;
    }
    setMessage('');
    setShowAgreement(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <main className="relative pt-header pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Listing</h2>
            <p className="text-sm text-gray-600">Sell your car to thousands of potential buyers</p>
          </div>

          {/* Modal Agreement */}
          {showAgreement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-orange-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Terms and Conditions
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-gray-700 text-sm">
                    <p className="mb-3">By submitting your listing, you agree that:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <svg className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Your listing will be visible to all users
                      </li>
                      <li className="flex items-start">
                        <svg className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        You are responsible for the accuracy of information
                      </li>
                      <li className="flex items-start">
                        <svg className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Inappropriate listings will be removed
                      </li>
                    </ul>
                  </div>
                  <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreementChecked}
                      onChange={e => setAgreementChecked(e.target.checked)}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">I accept the terms and conditions</span>
                  </label>
                  <div className="flex gap-3 pt-4">
                    <button
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => {
                        setShowAgreement(false);
                        setAgreementChecked(false);
                        setIsSubmitting(false); // Сбрасываем состояние загрузки при отмене
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      disabled={!agreementChecked || isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true); // Устанавливаем загрузку здесь
                        try {
                          await realAddListing();
                        } catch (error) {
                          console.error('Error in Add Listing:', error);
                          setIsSubmitting(false); // Гарантированно сбрасываем в случае ошибки
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Agree & Submit'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95 border border-orange-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Type Selection */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {vehicleTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setVehicleType(type.value as 'car' | 'motorcycle')
                        setTitle('')
                        setModel('')
                        setTransmission('')
                        setFuelType('')
                        setEngineSize('')
                        setEngineSizeWhole('')
                        setEngineSizeDecimal('')
                      }}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        vehicleType === type.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <div>{type.icon}</div>
                      <div className="font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div className="space-y-1">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  {vehicleType === 'car' ? 'Car Brand' : 'Motorcycle Brand'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    id="brand"
                    type="text"
                    placeholder={vehicleType === 'car' ? 'Select or type car brand' : 'Select or type motorcycle brand'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    list={vehicleType === 'car' ? 'car-brand-list' : 'motorcycle-brand-list'}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                  />
                  <datalist id="car-brand-list">
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                  <datalist id="motorcycle-brand-list">
                    {motorcycleBrands.map((brand) => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Model */}
              {availableModels.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Model <span className="text-gray-500 text-sm">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <input
                      id="model"
                      type="text"
                      placeholder="Select or type model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      list="model-list"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    />
                    <datalist id="model-list">
                      {availableModels.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* Price and Year Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price */}
                <div className="space-y-1">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">$</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="year"
                      type="number"
                      placeholder="Enter year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      list="year-list"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    />
                    <datalist id="year-list">
                      {Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i).map((y) => (
                        <option key={y} value={y} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div className="space-y-1">
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
                  Mileage <span className="text-gray-500 text-sm">(miles)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    id="mileage"
                    type="number"
                    placeholder="Enter mileage"
                    value={mileage}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^\d*$/.test(val)) setMileage(val)
                    }}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                {/* State */}
                <div className="space-y-1">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <select
                      id="state"
                      value={stateId}
                      onChange={e => setStateId(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    >
                      <option value="">Select state</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name} ({state.country_code === 'US' ? 'USA' : state.country_code === 'MX' ? 'Mexico' : state.country_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* City */}
                {stateId && (
                  <div className="space-y-1">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City <span className="text-gray-500 text-sm">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        id="city"
                        type="text"
                        placeholder="Start typing city name"
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        list="city-list"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        autoComplete="off"
                      />
                      <datalist id="city-list">
                        {cities.map(city => (
                          <option key={city.id} value={city.name} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Start typing to choose from available cities</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transmission (Cars only) */}
                {vehicleType === 'car' && (
                  <div className="space-y-1">
                    <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">
                      Transmission
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <select
                        id="transmission"
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                      >
                        <option value="">Select transmission</option>
                        {transmissionOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Engine Size (For all vehicles) */}
                <div className="space-y-1">
                  <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700">
                    Engine Size ({vehicleType === 'motorcycle' ? 'cc' : 'L'})
                  </label>
                  <div className="relative">
                    {vehicleType === 'motorcycle' ? (
                      /* Мотоциклы: одно поле в cc */
                      <input
                        id="engineSize"
                        type="number"
                        step="1"
                        min="50"
                        max="3000"
                        placeholder="e.g. 600"
                        value={engineSize}
                        onChange={(e) => setEngineSize(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                      />
                    ) : (
                      /* Машины: два поля для литров */
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="9"
                          placeholder="2"
                          value={engineSizeWhole}
                          onChange={(e) => setEngineSizeWhole(e.target.value)}
                          className="block w-16 px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-center"
                        />
                        <span className="text-gray-500 font-medium">.</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          placeholder="0"
                          value={engineSizeDecimal}
                          onChange={(e) => setEngineSizeDecimal(e.target.value)}
                          className="block w-16 px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-center"
                        />
                        <span className="text-gray-500 font-medium ml-2">L</span>
                      </div>
                    )}
                  </div>
                  {vehicleType === 'car' && (
                    <p className="text-xs text-gray-500 mt-1">Enter engine size (e.g., 2.0L = enter 2 and 0)</p>
                  )}
                </div>

                {/* Fuel Type */}
                <div className="space-y-1">
                  <label htmlFor="fuel" className="block text-sm font-medium text-gray-700">
                    Fuel Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <select
                      id="fuel"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    >
                      <option value="">Select fuel type</option>
                      {(vehicleType === 'motorcycle' ? motorcycleFuelOptions : fuelOptions).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your car's condition, features, history, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">Tell buyers what makes your car special</p>
              </div>

              {/* Images Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Photos <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {images.length}/4 images
                  </span>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors duration-200">
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-orange-600">Upload photos</span>
                      <p className="text-xs text-gray-500">JPG, PNG or WEBP up to 500KB each</p>
                    </div>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <Image
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200 shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Preferences */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Preferences <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={contactByPhone}
                      onChange={(e) => setContactByPhone(e.target.checked)}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Allow phone contact</span>
                    </div>
                  </label>

                  <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={contactByEmail}
                      onChange={(e) => setContactByEmail(e.target.checked)}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Allow email contact</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500">Select at least one contact method</p>
              </div>

              {/* Error Message */}
              {message && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-orange-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="flex justify-center items-center py-3 px-8 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
