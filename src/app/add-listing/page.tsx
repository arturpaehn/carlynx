'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

const fuelOptions = ['gasoline', 'diesel', 'hybrid', 'electric', 'cng', 'lpg']
const transmissionOptions = ['manual', 'automatic']
const currentYear = new Date().getFullYear()

export default function AddListingPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [brands, setBrands] = useState<{ id: number, name: string }[]>([])
  const [cities, setCities] = useState<string[]>([])

  const [title, setTitle] = useState('')
  const [model, setModel] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileage, setMileage] = useState('')
  const [year, setYear] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
      } else {
        setUser(data.user)
      }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    const loadBrands = async () => {
      const { data, error } = await supabase.from('car_brands').select('id, name')
      if (error) {
        console.error('Failed to load brands:', error.message)
        return
      }
      setBrands(data)
    }

    const loadCities = async () => {
      const { data, error } = await supabase.from('texas_cities').select('name')
      if (error) {
        console.error('Failed to load cities:', error.message)
        return
      }
      const uniqueCities = Array.from(new Set(data.map(c => c.name))).sort()
      setCities(uniqueCities)
    }

    loadBrands()
    loadCities()
  }, [])

  useEffect(() => {
    const selected = brands.find(b => b.name === title)
    if (!selected) {
      setAvailableModels([])
      return
    }

    const loadModels = async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('name')
        .eq('brand_id', selected.id)

      if (error) {
        console.error('Failed to load models:', error.message)
        setAvailableModels([])
      } else {
        const uniqueModels = Array.from(new Set(data.map(d => d.name)))
        setAvailableModels(uniqueModels)
      }
    }

    loadModels()
  }, [title, brands])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const selected = Array.from(files)
    const supported = selected.filter(file =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )

    if (supported.length + images.length > 10) {
      setMessage('Maximum 10 images allowed.')
      return
    }

    setImages(prev => [...prev, ...supported])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!user?.id) {
      setMessage('Authentication failed.')
      return
    }

    if (!title || !year || !location || !price) {
      setMessage('Please fill in required fields: brand, year, location, price.')
      return
    }

    const { data: existingListings, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id)

    if (listingsError || !existingListings) {
      setMessage('Failed to check existing listings.')
      return
    }

    if (existingListings.length >= 3) {
      setMessage('You can only post up to 3 listings.')
      return
    }

    const { data: listingData, error: insertError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        model: model && model.trim() !== '' ? model : null,
        price: Number(price),
        location,
        description: description || null,
        transmission: transmission || null,
        fuel_type: fuelType || null,
        mileage: mileage ? Number(mileage) : null,
        year: Number(year),
      })
      .select()
      .single()

    if (insertError || !listingData) {
      console.error('Insert error:', insertError)
      setMessage(`Failed to add listing: ${insertError?.message || 'Unknown error'}`)
      return
    }

    const uploadedUrls: string[] = []

    for (const image of images) {
      const fileName = `${listingData.id}/${Date.now()}_${image.name}`

      const uploadResult = await supabase.storage
        .from('listing-images')
        .upload(fileName, image)

      if (uploadResult.error) {
        console.error('Image upload error:', uploadResult.error)
        setMessage(`Image upload failed: ${uploadResult.error.message}`)
        return
      }

      const urlResult = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName)

      uploadedUrls.push(urlResult.data.publicUrl)
    }

    if (uploadedUrls.length > 0) {
      const imageInserts = uploadedUrls.map(url => ({
        listing_id: listingData.id,
        image_url: url,
        user_id: user.id,
      }))

      const { error: imageInsertError } = await supabase
        .from('listing_images')
        .insert(imageInserts)

      if (imageInsertError) {
        console.error('Image insert error:', imageInsertError)
        setMessage('Failed to save image data.')
        return
      }
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px]">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Add New Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <input
            type="text"
            placeholder="Car Brand *"
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
            placeholder="Price *"
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
            placeholder="Year *"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            list="year-list"
            required
            className="w-full p-2 border rounded"
          />
          <datalist id="year-list">
            {Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i).map(y => (
              <option key={y} value={y} />
            ))}
          </datalist>

          <input
            type="text"
            placeholder="Location (City) *"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            list="city-list"
            required
            className="w-full p-2 border rounded"
          />
          <datalist id="city-list">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Transmission</option>
            {transmissionOptions.map(opt => (
              <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>

          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Fuel Type</option>
            {fuelOptions.map(opt => (
              <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
          <p className="text-sm text-gray-600">
            You can upload up to 10 images (.jpg, .png, .webp)
          </p>

          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Submit
          </button>

          {message && <p className="text-red-500 text-sm">{message}</p>}
        </form>
      </div>
    </div>
  )
}
