'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

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

      // Загружаем список штатов
      const { data: statesData } = await supabase
        .from('states')
        .select('id, code, name, country_code');
      if (statesData) setStates(statesData);

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

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title,
        model: model.trim() === '' ? null : model,
        price: Number(price),
        state_id: stateId ? Number(stateId) : null,
        description: description.trim() === '' ? null : description,
        transmission: transmission.trim() === '' ? null : transmission,
        fuel_type: fuelType.trim() === '' ? null : fuelType,
        mileage: mileage.trim() === '' ? null : Number(mileage),
        year: Number(year),
        city_id,
        city_name,
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

  if (loading) return <div className="pt-header text-center">Loading...</div>
  if (error) return <div className="pt-header text-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-header">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Edit Listing</h1>

        <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded shadow">
          <input type="text" placeholder="Car Brand *" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Model (optional)" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 border rounded" />
          <input type="number" placeholder="Price *" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-2 border rounded" />
          <input type="number" placeholder="Mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} className="w-full p-2 border rounded" />
          <input type="number" placeholder="Year *" value={year} onChange={(e) => setYear(e.target.value)} required className="w-full p-2 border rounded" />
          {/* Location (State) с автозаполнением */}
          <select
            value={stateId}
            onChange={e => setStateId(e.target.value)}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select State *</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name} ({state.country_code === 'US' ? 'USA' : state.country_code === 'MX' ? 'Mexico' : state.country_code})
              </option>
            ))}
          </select>
          <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select Transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
          <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select Fuel Type</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="cng">CNG</option>
            <option value="lpg">LPG</option>
          </select>
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />

          {/* Ввод города вместо select */}
          {stateId && (
            <div>
              <input
                type="text"
                placeholder="City (optional) — choose or type manually"
                value={cityInput}
                onChange={e => {
                  setCityInput(e.target.value);
                }}
                list="city-list"
                className="w-full p-2 border rounded"
                autoComplete="off"
                disabled={!stateId}
              />
              <datalist id="city-list">
                {cities.map(city => (
                  <option key={city.id} value={city.name} />
                ))}
              </datalist>
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium">Images (max 5, .jpg, .png, .webp, max 500 KB each)</label>
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
            <p className="text-sm text-gray-600 mt-2">
              You can upload up to 5 images (.jpg, .png, .webp, max 500 KB each)
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative">
                  <Image src={img.image_url} alt="Existing" width={200} height={96} className="w-full h-24 object-cover rounded border" />
                  <button type="button" onClick={() => removeExistingImage(img.id, img.image_url)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
              {newPreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <Image src={src} alt={`Preview ${idx}`} width={200} height={96} className="w-full h-24 object-cover rounded border" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Save Changes</button>
            <button type="button" onClick={handleCancel} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Cancel</button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Deactivate Listing
            </button>
          </div>

          {showConfirm && (
            <div className="fixed inset-0 bg-orange-500 bg-opacity-90 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-md p-6 text-center">
                <h2 className="text-xl font-bold mb-4 text-red-700">Are you sure?</h2>
                <p className="mb-6 text-gray-700">
                  Once deactivated, this listing will no longer be visible and cannot be restored.<br />
                  Refunds are not available.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivate}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {message && <p className="text-red-500 text-sm mt-2">{message}</p>}
        </form>
      </div>
    </div>
  )
}
