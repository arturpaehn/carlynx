'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type ListingImage = {
  image_url: string
}

type RawListing = {
  id: string
  title: string
  description?: string
  price: number
  location?: string
  listing_images: ListingImage[]
}

type Listing = {
  id: string
  title: string
  description?: string
  price: number
  location?: string
  image_url?: string
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          location,
          listing_images (
            image_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Supabase error:', error.message)
        setLoading(false)
        return
      }

      const formatted: Listing[] = (data as RawListing[]).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        location: item.location,
        image_url: item.listing_images?.[0]?.image_url ?? undefined,
      }))

      setListings(formatted)
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#fff2e0] pt-[224px] mt-[-224px]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Приветствие */}
        <section className="bg-[#ffe6cc] py-8 px-4 text-center shadow-inner rounded mb-8">
          <h2 className="text-3xl font-bold text-orange-700 mb-2">Welcome to CarLynx</h2>
          <p className="max-w-2xl mx-auto text-gray-800 text-base sm:text-lg leading-relaxed">
            CarLynx is your trusted platform to buy and sell used cars across Texas.
            Whether you&apos;re a private owner or a car enthusiast, we help you connect,
            list, and find great vehicles quickly and securely.
          </p>
        </section>

        {/* Объявления */}
        <h1 className="text-3xl font-bold mb-6 text-center">Latest Cars in Texas</h1>

        {loading ? (
          <p>Loading...</p>
        ) : listings.length === 0 ? (
          <p>No listings available.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {listings.map((item) => (
              <li key={item.id}>
                <Link href={`/listing/${item.id}`}>
                  <div className="bg-white p-4 rounded shadow hover:shadow-md transition cursor-pointer h-full">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                    <p className="text-green-700 font-bold text-lg">${item.price}</p>
                    {item.location && (
                      <p className="text-sm text-gray-600">{item.location}</p>
                    )}
                    {item.description && (
                      <p className="mt-2 text-gray-700 text-sm line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
