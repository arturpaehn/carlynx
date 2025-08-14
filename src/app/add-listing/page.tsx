'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const fuelOptions = ['gasoline', 'diesel', 'hybrid', 'electric', 'cng', 'lpg']
const transmissionOptions = ['manual', 'automatic']
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

// --- Dealer keywords (старый массив) ---
const dealerKeywords = [
  'dealership','dealer','auto dealer','car dealership','certified dealer','pre-owned center','used car lot','showroom','inventory','fleet','trade-ins accepted','commercial use','financing available','low monthly payments','in-house financing','easy approval','buy here pay here','guaranteed approval','extended warranty','certified pre-owned','vehicle inspection report','all credit welcome','special offer','down payment','zero down','we finance','apply today','no credit check','stock','vin available','ready for test drive','contact our sales team','visit our location','call our office','schedule an appointment','open 7 days a week','ask for','multi-point inspection','financing options','service history available','dealership fees','trade-in value','fleet maintained','carfax available','insurance options'
];

export default function AddListingPage() {
  const userProfile = useUser();
  const router = useRouter()
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
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
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const [contactByPhone, setContactByPhone] = useState(true)
  const [contactByEmail, setContactByEmail] = useState(false)

  // Новые состояния для модального окна
  const [showAgreement, setShowAgreement] = useState(false)
  const [agreementChecked, setAgreementChecked] = useState(false)

  // useUser уже возвращает профиль или null, отдельная проверка не нужна

  useEffect(() => {
    const loadBrands = async () => {
      const { data, error } = await supabase.from('car_brands').select('id, name')
      if (!error) setBrands(data)
    }

    // Загружаем список штатов США и Мексики
    const loadStates = async () => {
      const { data, error } = await supabase.from('states').select('id, code, name, country_code')
      if (!error) setStates(data)
    }

    loadBrands()
    loadStates()
  }, [])

  // Загружаем города при выборе штата
  useEffect(() => {
    if (!stateId) {
      setCities([])
      setCityInput('')
      return
    }
    const loadCities = async () => {
      const { data, error } = await supabase.from('cities').select('id, name, state_id').eq('state_id', stateId)
      if (!error && data) {
        setCities(data)
      } else {
        setCities([])
      }
      setCityInput('')
    }
    loadCities()
  }, [stateId])

  useEffect(() => {
    const selected = brands.find((b) => b.name === title)
    if (!selected) return setAvailableModels([])

    const loadModels = async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('name')
        .eq('brand_id', selected.id)

      if (!error) {
        const unique = Array.from(new Set(data.map((d) => d.name)))
        setAvailableModels(unique)
      }
    }

    loadModels()
  }, [title, brands])

  const MAX_IMAGES = 5;
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
    if (!userProfile || !('user_id' in userProfile) || !userProfile.user_id) {
      setMessage('Authentication failed.');
      return;
    }
    // Проверка на максимальное количество активных объявлений
    const { data: existingListings } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', userProfile.user_id)
      .eq('is_active', true);
    if ((existingListings?.length || 0) >= 3) {
      setMessage('You have reached the maximum number of active listings.');
      setShowAgreement(false);
      setAgreementChecked(false);
      return;
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
        transmission: transmission || null,
        fuel_type: fuelType || null,
        mileage: mileage ? Number(mileage) : null,
        description: description || null,
        contact_by_phone: contactByPhone,
        contact_by_email: contactByEmail,
        is_active: true,
        views: 0
      }
    ]).select('id').single();
    if (insertError || !insertData?.id) {
      setMessage('Listing submission failed: ' + (insertError?.message || 'No ID'));
      setShowAgreement(false);
      setAgreementChecked(false);
      return;
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
        setMessage('Listing submission failed: ' + uploadError.message);
        setShowAgreement(false);
        setAgreementChecked(false);
        return;
      }
      // get public url
      const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) {
        setMessage('Listing submission failed: Failed to get image URL');
        setShowAgreement(false);
        setAgreementChecked(false);
        return;
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
        setMessage('Listing submission failed: ' + imgInsertError.message);
        setShowAgreement(false);
        setAgreementChecked(false);
        return;
      }
    }
    setShowAgreement(false);
    setAgreementChecked(false);
    router.push('/my-listings');
  };

  // Проверка блокировки пользователя (после всех хуков)
  if (userProfile && 'is_blocked' in userProfile && userProfile.is_blocked) {
    return (
      <div className="pt-48 text-center text-red-600 font-bold text-lg">
        You are blocked due to a violation of the platform policy. Access denied.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Проверки до показа модалки
    if (!title || !year || !stateId || !price) {
      setMessage('Please fill in all required fields.');
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
    // --- Harmful content check ---
    const desc = description.toLowerCase();
    if (harmfulKeywords.some(word => desc.includes(word))) {
      if (userProfile && 'user_id' in userProfile && userProfile.user_id) {
        await supabase.rpc('increment_abuse_attempts', { user_id_param: userProfile.user_id });
      }
      setMessage('🚫 Your listing contains words or phrases that are not allowed on Carlynx (profanity, hate, sexual, or violent content). Please remove any inappropriate language and try again. Repeated attempts may result in account restrictions.');
      return;
    }
    // --- Dealer keyword check ---
    if (dealerKeywords.some(word => desc.includes(word))) {
      if (userProfile && 'user_id' in userProfile && userProfile.user_id) {
        await supabase.rpc('increment_dealer_attempts', { user_id_param: userProfile.user_id });
      }
      setMessage('⚠️ Your listing appears to contain language commonly used by dealerships. Carlynx is dedicated exclusively to private sellers. If you are a dealer, please note that listings from dealerships are not permitted. Kindly review and revise your description to ensure it reflects a private sale.');
      return;
    }
    setMessage('');
    setShowAgreement(true);
  };

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px]">
      <div className="max-w-xl mx-auto p-2 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">Add New Listing</h1>
        {/* Модальное окно подтверждения условий */}
        {showAgreement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-500 bg-opacity-90">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-4 border-orange-500">
              <h2 className="text-xl font-bold mb-3 text-orange-600">Terms and Conditions</h2>
              <div className="mb-4 text-gray-800">
                By submitting your listing, you agree that:
                <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                  <li>Your listing will be visible to all users.</li>
                  <li>You are responsible for the accuracy of the information provided.</li>
                  <li>Inappropriate or fraudulent listings will be removed.</li>
                </ul>
              </div>
              <label className="flex items-center mb-4 text-sm">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={e => setAgreementChecked(e.target.checked)}
                  className="mr-2"
                />
                I accept the terms and conditions
              </label>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded bg-white border border-orange-500 text-orange-600 hover:bg-orange-100"
                  onClick={() => {
                    setShowAgreement(false);
                    setAgreementChecked(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                  disabled={!agreementChecked}
                  onClick={async () => {
                    await realAddListing();
                  }}
                >
                  Agree
                </button>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 bg-white p-3 sm:p-6 rounded shadow">
          <input
            type="text"
            placeholder="Car brand (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            list="car-brand-list"
            required
            className="w-full p-2 border rounded"
          />
          <datalist id="car-brand-list">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name} />
            ))}
          </datalist>

          {availableModels.length > 0 && (
            <>
              <input
                type="text"
                placeholder="Model (optional)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                list="model-list"
                className="w-full p-2 border rounded"
              />
              <datalist id="model-list">
                {availableModels.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </>
          )}

          <input
            type="number"
            placeholder="Price (required)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            placeholder="Mileage (miles)"
            value={mileage}
            onChange={(e) => {
              const val = e.target.value
              if (/^\d*$/.test(val)) setMileage(val)
            }}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            placeholder="Year (required)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            list="year-list"
            required
            className="w-full p-2 border rounded"
          />
          <datalist id="year-list">
            {Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i).map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>

          <select
            value={stateId}
            onChange={e => setStateId(e.target.value)}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select state (required)</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name} ({state.country_code === 'US' ? 'USA' : state.country_code === 'MX' ? 'Mexico' : state.country_code})
              </option>
            ))}
          </select>

          {stateId && (
            <div>
              <input
                type="text"
                placeholder="City (optional)"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                list="city-list"
                className="w-full p-2 border rounded"
                autoComplete="off"
              />
              <datalist id="city-list">
                {cities.map(city => (
                  <option key={city.id} value={city.name} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Start typing to choose a city</p>
            </div>
          )}

          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select transmission</option>
            {transmissionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select fuel type</option>
            {fuelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Description (required)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <div>
            <label
              htmlFor="image-upload"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded cursor-pointer"
            >
              Upload Images
            </label>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-sm text-gray-600 mt-2">You can upload up to 5 images. Only JPG, PNG, or WEBP formats are allowed.</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <Image
                    src={src}
                    alt={`Preview ${idx}`}
                    width={200}
                    height={96}
                    className="w-full h-20 sm:h-24 object-cover rounded border"
                    style={{ minHeight: '5rem', background: '#eee' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contactByPhone}
                onChange={(e) => setContactByPhone(e.target.checked)}
              />
              Contact by phone
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contactByEmail}
                onChange={(e) => setContactByEmail(e.target.checked)}
              />
              Contact by email
            </label>
          </div>

          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full sm:w-auto"
          >
            Submit
          </button>

          {message && (
            <div
              className="mt-4 p-4 rounded border-2 border-orange-400 bg-orange-50 text-orange-900 text-sm font-medium flex items-start gap-2"
              style={{ boxShadow: '0 2px 8px rgba(255, 140, 0, 0.08)' }}
            >
              <span style={{fontSize: '1.5em', lineHeight: '1'}} aria-hidden="true">⚠️</span>
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
