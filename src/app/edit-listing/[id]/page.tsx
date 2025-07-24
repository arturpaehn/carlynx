'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function EditListingPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [model, setModel] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileage, setMileage] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Failed to load listing.')
        setLoading(false)
        return
      }

      setTitle(data.title || '')
      setModel(data.model || '')
      setPrice(data.price?.toString() || '')
      setLocation(data.location || '')
      setDescription(data.description || '')
      setTransmission(data.transmission || '')
      setFuelType(data.fuel_type || '')
      setMileage(data.mileage?.toString() || '')
      setYear(data.year?.toString() || '')
      setLoading(false)
    }

    fetchListing()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase
      .from('listings')
      .update({
        title,
        model: model.trim() === '' ? null : model,
        price: Number(price),
        location,
        description: description.trim() === '' ? null : description,
        transmission: transmission.trim() === '' ? null : transmission,
        fuel_type: fuelType.trim() === '' ? null : fuelType,
        mileage: mileage.trim() === '' ? null : Number(mileage),
        year: Number(year),
      })
      .eq('id', id)

    if (error) {
      setMessage('Failed to update listing.')
    } else {
      router.push('/my-listings')
    }
  }

  const handleCancel = () => {
    router.push('/my-listings')
  }

  if (loading) return <div className="pt-[224px] text-center">Loading...</div>
  if (error) return <div className="pt-[224px] text-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px]">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Edit Listing</h1>

        <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded shadow">
          <input
            type="text"
            placeholder="Car Brand *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            placeholder="Model (optional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-2 border rounded"
          />

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
            placeholder="Mileage"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            placeholder="Year *"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            placeholder="Location *"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>

          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Fuel Type</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="cng">CNG</option>
            <option value="lpg">LPG</option>
          </select>

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"

            >
              Cancel
            </button>
          </div>

          {message && <p className="text-red-500 text-sm">{message}</p>}
        </form>
      </div>
    </div>
  )
}
