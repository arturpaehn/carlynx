'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

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

export default function EditListingPage() {
  // Массив ключевых слов для дилеров (как в add-listing)
  const dealerKeywords = [
    'dealership',
    'dealer',
    'auto dealer',
    'car dealership',
    'certified dealer',
    'pre-owned center',
    'used car lot',
    'showroom',
    'inventory',
    'fleet',
    'trade-ins accepted',
    'commercial use',
    'financing available',
    'low monthly payments',
    'in-house financing',
    'easy approval',
    'buy here pay here',
    'guaranteed approval',
    'extended warranty',
    'certified pre-owned',
    'vehicle inspection report',
    'all credit welcome',
    'special offer',
    'down payment',
    'zero down',
    'we finance',
    'apply today',
    'no credit check',
    'stock',
    'vin available',
    'ready for test drive',
    'contact our sales team',
    'visit our location',
    'call our office',
    'schedule an appointment',
    'open 7 days a week',
    'ask for',
    'multi-point inspection',
    'financing options',
    'service history available',
    'dealership fees',
    'trade-in value',
    'fleet maintained',
    'carfax available',
    'insurance options'
  ];
  const params = useParams();
  const id = params && typeof params === 'object' && 'id' in params ? String((params as Record<string, string | string[]>).id) : '';
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const [user, setUser] = useState<User | null>(null)

  const [title, setTitle] = useState('')
  const [model, setModel] = useState('')
  const [price, setPrice] = useState('')
  // Новое поле для штата
  const [states, setStates] = useState<{ id: number; code: string; name: string; country_code: string }[]>([])
  const [stateId, setStateId] = useState('')
  const [description, setDescription] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileage, setMileage] = useState('')
  const [year, setYear] = useState('')
  
  // Новые поля для поддержки мотоциклов
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car')
  const [engineSize, setEngineSize] = useState('')
  const [engineSizeWhole, setEngineSizeWhole] = useState('')
  const [engineSizeDecimal, setEngineSizeDecimal] = useState('')
  const [motorcycleBrands, setMotorcycleBrands] = useState<{ id: number; name: string }[]>([])

  const [existingImages, setExistingImages] = useState<{ id: number; image_url: string }[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  // Состояния для города и объявления
  const [cities, setCities] = useState<{ id: number; name: string; state_id: number }[]>([]);
  const [cityInput, setCityInput] = useState('');
  type Listing = {
    id: number;
    title: string;
    model: string | null;
    price: number;
    state_id: number | null;
    city_id: number | null;
    city_name: string | null;
    description: string | null;
    transmission: string | null;
    fuel_type: string | null;
    mileage: number | null;
    year: number | null;
    vehicle_type: string | null;
    engine_size: number | null;
    // ...добавьте другие поля, если есть
  };
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    const loadUserAndListing = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }
      setUser(authData.user);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setError('Failed to load listing.');
        setLoading(false);
        return;
      }

      setListing(data);
      setTitle(data.title || '');
      setModel(data.model || '');
      setPrice(data.price?.toString() || '');
      setStateId(data.state_id ? String(data.state_id) : '');
      setDescription(data.description || '');
      setTransmission(data.transmission || '');
      setFuelType(data.fuel_type || '');
      setMileage(data.mileage?.toString() || '');
      setYear(data.year?.toString() || '');
      
      // Обработка новых полей для мотоциклов
      setVehicleType(data.vehicle_type === 'motorcycle' ? 'motorcycle' : 'car');
      
      if (data.engine_size) {
        if (data.vehicle_type === 'motorcycle') {
          setEngineSize(data.engine_size.toString());
        } else {
          // Конвертируем cc в литры для машин
          const liters = data.engine_size / 1000;
          const whole = Math.floor(liters);
          const decimal = Math.round((liters - whole) * 10);
          setEngineSizeWhole(whole.toString());
          setEngineSizeDecimal(decimal.toString());
        }
      }

      // Загружаем список штатов
      const { data: statesData } = await supabase
        .from('states')
        .select('id, code, name, country_code');
      if (statesData) setStates(statesData);
      
      // Загружаем мотоциклетные бренды
      const { data: motorcycleBrandsData } = await supabase
        .from('motorcycle_brands')
        .select('id, name');
      if (motorcycleBrandsData) setMotorcycleBrands(motorcycleBrandsData);

      const { data: imageData } = await supabase
        .from('listing_images')
        .select('id, image_url')
        .eq('listing_id', id);

      if (imageData) setExistingImages(imageData);

      setLoading(false);
    };
    loadUserAndListing();
  }, [id, router]);

  // Загрузка городов при выборе штата
  useEffect(() => {
    if (!stateId) {
      setCities([]);
      setCityInput('');
      return;
    }
    supabase
      .from('cities')
      .select('id, name, state_id')
      .eq('state_id', stateId)
      .then(({ data }) => {
        setCities(data || []);
        // если есть listing и city_id, и город найден — подставить его в cityInput
        if (listing && listing.city_id && data) {
          const found = (data as { id: number; name: string }[]).find(c => c.id === listing.city_id);
          if (found) setCityInput(found.name);
        }
      });
  }, [stateId, listing]);

  // При загрузке объявления — подставить город
  useEffect(() => {
    if (listing) {
      // setStateId(listing.state_id ? String(listing.state_id) : ''); // не трогаем stateId, иначе зациклит
      if (listing.city_name) setCityInput(listing.city_name);
      else if (listing.city_id && cities.length) {
        const found = cities.find(c => c.id === listing.city_id);
        if (found) setCityInput(found.name);
      }
    }
  }, [listing, cities]);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );

    // Проверка на количество
    if (existingImages.length + newImages.length + selected.length > MAX_IMAGES) {
      setMessage(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    // Проверка на размер
    const tooLarge = selected.find((file) => file.size > MAX_IMAGE_SIZE);
    if (tooLarge) {
      setMessage(
        `One or more images are too large (max 500 KB each). Please resize or compress your photo.\n\nYou can use free tools like:\n- https://www.iloveimg.com/compress-image\n- https://www.img2go.com/compress-image\n- https://www.photopea.com/ (File > Export As > JPG/PNG, set quality/size)`
      );
      return;
    }

    const updated = [...newImages, ...selected];
    const previews = updated.map((f) => URL.createObjectURL(f));

    setNewImages(updated);
    setNewPreviews(previews);
  };

  const removeExistingImage = async (imageId: number, url: string) => {
    await supabase.from('listing_images').delete().eq('id', imageId);

    const path = url.split('/listing-images/')[1];
    if (path) {
      await supabase.storage.from('listing-images').remove([path]);
    }

    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Проверка: хотя бы одна картинка (существующая или новая)
    if (existingImages.length + newImages.length === 0) {
      setMessage('Please upload at least one image to save changes.');
      return;
    }

    if (existingImages.length + newImages.length > MAX_IMAGES) {
      setMessage(`You cannot have more than ${MAX_IMAGES} images.`);
      return;
    }

    // Проверка на дилерские слова (как в add-listing)
    const desc = description.toLowerCase();
    if (dealerKeywords.some(word => desc.includes(word))) {
      // Увеличить dealer_attempts_count через RPC, если есть user
      if (user?.id) {
        await supabase.rpc('increment_dealer_attempts', { user_id_param: user.id });
      }
      setMessage(
        '⚠️ Your listing appears to contain language commonly used by dealerships. Carlynx is dedicated exclusively to private sellers. If you are a dealer, please note that listings from dealerships are not permitted. Kindly review and revise your description to ensure it reflects a private sale.'
      );
      return;
    }

    // В функции handleUpdate (или где отправляется форма):
    let city_id = null;
    let city_name = null;
    const foundCity = cities.find(c => c.name.toLowerCase() === cityInput.trim().toLowerCase());
    if (foundCity) {
      city_id = foundCity.id;
    } else if (cityInput.trim()) {
      city_name = cityInput.trim();
    }

    // Валидация полей
    if (!vehicleType) {
      setMessage('Please select a vehicle type.');
      return;
    }

    // Для мотоциклов - проверяем поле engineSize (в cc)
    let engineSizeInCC = null;
    if (vehicleType === 'motorcycle') {
      if (!engineSize || Number(engineSize) < 50) {
        setMessage('Please enter a valid engine size for motorcycles (50cc or more).');
        return;
      }
      engineSizeInCC = Number(engineSize);
    } else {
      // Для машин - конвертируем из литров в cc
      if (engineSizeWhole && Number(engineSizeWhole) >= 0) {
        const whole = Number(engineSizeWhole) || 0;
        const decimal = Number(engineSizeDecimal) || 0;
        const liters = whole + (decimal / 10);
        engineSizeInCC = Math.round(liters * 1000); // Конвертируем в cc
      }
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title,
        model: model.trim() === '' ? null : model,
        price: Number(price),
        state_id: stateId ? Number(stateId) : null,
        description: description.trim() === '' ? null : description,
        transmission: vehicleType === 'car' ? (transmission.trim() === '' ? null : transmission) : null,
        fuel_type: fuelType.trim() === '' ? null : fuelType,
        mileage: mileage.trim() === '' ? null : Number(mileage),
        year: Number(year),
        city_id,
        city_name,
        vehicle_type: vehicleType,
        engine_size: engineSizeInCC,
      })
      .eq('id', id);

    if (updateError) {
      setMessage('Failed to update listing.');
      return;
    }

    if (newImages.length > 0 && user?.id) {
      const uploadedUrls: string[] = [];

      for (const image of newImages) {
        const sanitizedName = image.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-.]/g, '');
        const fileName = `${id}/${Date.now()}_${sanitizedName}`;

        const uploadResult = await supabase.storage
          .from('listing-images')
          .upload(fileName, image);

        if (uploadResult.error) {
          setMessage(`Image upload failed: ${uploadResult.error.message}`);
          return;
        }

        const urlResult = supabase.storage.from('listing-images').getPublicUrl(fileName);
        uploadedUrls.push(urlResult.data.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        await supabase.from('listing_images').insert(
          uploadedUrls.map((url) => ({
            listing_id: id,
            image_url: url,
            user_id: user.id,
          }))
        );
      }
    }

    router.push('/my-listings');
  };

  const handleCancel = () => {
    router.push('/my-listings')
  }

  const handleDeactivate = async () => {
    const { error } = await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', id)

    if (!error) {
      router.push('/my-listings')
    } else {
      setMessage('Failed to deactivate the listing.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center pt-header">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center pt-header">
        <div className="text-center text-red-500">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xl font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <main className="relative px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Your Listing</h2>
            <p className="text-gray-600">Update your car listing details</p>
          </div>

        <form onSubmit={handleUpdate} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
          
          {/* Brand field depending on vehicle type */}
          <div className="space-y-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              {vehicleType === 'motorcycle' ? 'Motorcycle Brand' : 'Car Brand'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              {vehicleType === 'motorcycle' ? (
                <select
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
                >
                  <option value="">Select motorcycle brand</option>
                  {motorcycleBrands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="title"
                  type="text"
                  placeholder="Toyota, Honda, BMW..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                />
              )}
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Model (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <input
                id="model"
                type="text"
                placeholder="Camry, Civic, X5..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Price and Year row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div className="space-y-1">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">$</span>
                </div>
                <input
                  id="price"
                  type="number"
                  placeholder="25000"
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
                Year *
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
                  placeholder="2020"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Mileage */}
          <div className="space-y-1">
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
              Mileage (optional)
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
                placeholder="50000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">miles</span>
              </div>
            </div>
          </div>
          {/* State */}
          <div className="space-y-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State *
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name} ({state.country_code === 'US' ? 'USA' : state.country_code === 'MX' ? 'Mexico' : state.country_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City Input */}
          {stateId && (
            <div className="space-y-1">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                  </svg>
                </div>
                <input
                  id="city"
                  type="text"
                  placeholder="Choose from dropdown or type manually"
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
                    if (type.value !== vehicleType) {
                      setTitle('')
                      setModel('')
                      setTransmission('')
                      setFuelType('')
                      setEngineSize('')
                      setEngineSizeWhole('')
                      setEngineSizeDecimal('')
                    }
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

          {/* Transmission and Engine Size row */}
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <select
                id="fuel"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
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
              Description (optional)
            </label>
            <div className="relative">
              <textarea
                id="description"
                placeholder="Tell buyers what makes your car special"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tell buyers what makes your car special</p>
          </div>

          {/* Images Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Images (max 4, .jpg, .png, .webp, max 500 KB each)
              </label>
              <span className="text-sm text-gray-500">{existingImages.length + newImages.length}/4</span>
            </div>
            
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 500KB each</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-sm text-gray-600">
              You can upload up to 4 images (.jpg, .png, .webp, max 500 KB each)
            </p>
            
            {(existingImages.length > 0 || newPreviews.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <Image 
                        src={img.image_url} 
                        alt="Car image" 
                        width={200} 
                        height={200} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeExistingImage(img.id, img.image_url)} 
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <Image 
                        src={src} 
                        alt={`Preview ${idx + 1}`} 
                        width={200} 
                        height={200} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeNewImage(idx)} 
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-200"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      New
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            
            <button
              type="submit"
              className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          </div>

          {/* Delete Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center justify-center mx-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Deactivate Listing
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently remove your listing from the site
            </p>
          </div>
        </form>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all duration-300 scale-100">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Delete Listing?</h2>
                <p className="text-gray-600 leading-relaxed">
                  This action cannot be undone. Your listing will be permanently removed from the site and will no longer be visible to potential buyers.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-300 transition-colors duration-200"
                >
                  Keep Listing
                </button>
                <button
                  onClick={handleDeactivate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {message && <p className="text-red-500 text-sm mt-2">{message}</p>}
        </div>
      </main>
    </div>
  )
}
