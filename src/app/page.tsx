'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: string
  title: string
  description?: string
  price: number
  location?: string
  images?: string[]
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error.message)
      } else {
        setListings(data as Listing[])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Used Cars in Texas</h1>

      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p>No listings available.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((item) => (
            <li key={item.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-green-700 font-bold">${item.price}</p>
              {item.location && (
                <p className="text-sm text-gray-600">{item.location}</p>
              )}
              {item.description && (
                <p className="mt-2 text-gray-700">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
