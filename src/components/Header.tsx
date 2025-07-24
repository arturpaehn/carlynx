'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Header() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()

  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [location, setLocation] = useState('')
  const [year, setYear] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')

  const [years, setYears] = useState<number[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    router.refresh()
  }

  const user = session?.user
  const fullName = user?.user_metadata?.full_name || user?.email

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const yearList = []
    for (let y = 1900; y <= currentYear; y++) {
      yearList.push(y)
    }
    setYears(yearList.reverse())
  }, [])

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.from('car_brands').select('name')
      if (!error && data) {
        setBrands(data.map(b => b.name))
      }
    }

    const fetchLocations = async () => {
      const { data, error } = await supabase.from('texas_cities').select('name')
      if (!error && data) {
        setLocations(data.map(c => c.name))
      }
    }

    fetchBrands()
    fetchLocations()
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      if (!brand) {
        setModels([])
        return
      }

      const { data: brandData } = await supabase
        .from('car_brands')
        .select('id')
        .eq('name', brand)
        .single()

      if (!brandData) {
        setModels([])
        return
      }

      const { data: modelData } = await supabase
        .from('car_models')
        .select('name')
        .eq('brand_id', brandData.id)

      if (modelData) {
        setModels(modelData.map(m => m.name))
      } else {
        setModels([])
      }
    }

    fetchModels()
  }, [brand, supabase])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    if (model) params.append('model', model)
    if (priceMin) params.append('price_min', priceMin)
    if (priceMax) params.append('price_max', priceMax)
    if (location) params.append('location', location)
    if (year) params.append('year', year)
    if (transmission) params.append('transmission', transmission)
    if (fuelType) params.append('fuel_type', fuelType)

    router.push(`/search-results?${params.toString()}`)
    setSearchOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#ffe6cc] shadow border-b">
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        {/* Логотип сверху */}
        <Link href="/">
          <img src="/logo.png" alt="CarLynx Logo" className="h-32 w-auto" />
        </Link>

        {/* Кнопки и приветствие */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Search
          </button>

          {user ? (
            <>
              <span className="text-gray-800 text-sm font-medium">Hi, {fullName}</span>

              <Link
                href="/profile"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                My Profile
              </Link>

              <Link
                href="/add-listing"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                Add Listing
              </Link>

              <Link
                href="/my-listings"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                My Listings
              </Link>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm disabled:opacity-50"
              >
                {loading ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Фильтры поиска */}
        {searchOpen && (
          <div className="w-full max-w-5xl bg-white p-4 rounded shadow mt-4 flex flex-wrap gap-2 justify-center">
            <input
              type="text"
              placeholder="Brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              list="brand-list"
              className="p-2 border rounded"
            />
            <datalist id="brand-list">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>

            <input
              type="text"
              placeholder="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              list="model-list"
              className="p-2 border rounded"
              disabled={models.length === 0}
            />
            <datalist id="model-list">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>

            <input
              type="number"
              placeholder="Min Price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="p-2 border rounded"
            />

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              list="city-list"
              className="p-2 border rounded"
            />
            <datalist id="city-list">
              {locations.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Transmission</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>

            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Fuel Type</option>
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
              <option value="cng">Compressed Gas</option>
              <option value="lpg">Liquefied Gas</option>
            </select>

            <button
              onClick={applyFilters}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
