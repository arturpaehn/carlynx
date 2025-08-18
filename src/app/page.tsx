'use client'


import { useEffect, useState } from 'react'
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'






type Listing = {
  id: string
  title: string
  model?: string
  year?: number
  price: number
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
  image_url?: string
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const user = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          model,
          year,
          price,
          state_id,
          city_id,
          city_name,
          states (id, name, code, country_code),
          cities (id, name),
          listing_images (
            image_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Supabase error:', error.message)
        setLoading(false)
        return
      }

      const formatted: Listing[] = Array.isArray(data)
        ? data.map((item) => {
            let stateObj: { name: string; code: string; country_code: string } | null = null;
            if (item.states) {
              if (Array.isArray(item.states) && item.states.length > 0 && typeof item.states[0] === 'object' && 'name' in item.states[0]) {
                stateObj = {
                  name: item.states[0].name,
                  code: item.states[0].code,
                  country_code: item.states[0].country_code,
                };
              } else if (!Array.isArray(item.states) && typeof item.states === 'object' && 'name' in item.states) {
                const s = item.states as { name: string; code: string; country_code: string };
                stateObj = {
                  name: s.name,
                  code: s.code,
                  country_code: s.country_code,
                };
              }
            }
            // Определяем город: если есть city_name (ручной ввод) — берём его, иначе — название из cities
            let city: string | null = null;
            if (item.city_name && item.city_name.trim()) {
              city = item.city_name.trim();
            } else if (item.cities && Array.isArray(item.cities) && item.cities[0]?.name) {
              city = item.cities[0].name;
            } else if (item.cities && typeof item.cities === 'object' && 'name' in item.cities) {
              city = (item.cities as { name: string }).name;
            }
            return {
              id: item.id,
              title: item.title,
              model: item.model ?? '',
              year: item.year ?? undefined,
              price: item.price,
              state: stateObj,
              city,
              image_url: Array.isArray(item.listing_images) && item.listing_images[0]?.image_url
                ? item.listing_images[0].image_url
                : undefined,
            }
          })
        : []

      setListings(formatted)
      setLoading(false)
    }

    fetchData()
  }, [user])



  return (
    <main className="min-h-screen bg-[#fff2e0] pt-40 mt-[-40px]">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <section className="bg-[#ffe6cc] py-8 sm:py-14 px-2 sm:px-8 text-center shadow-inner rounded-2xl mb-6 sm:mb-12 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-700 drop-shadow-lg tracking-tight inline-block">
            Welcome to CarLynx
          </h1>
          <p className="max-w-2xl mx-auto text-gray-800 text-lg sm:text-xl font-medium leading-relaxed mb-2 sm:mb-4">
            CarLynx is your trusted marketplace for buying and selling cars across Texas and nearby states.<br className="hidden sm:block" />
            Whether you&apos;re a private seller or a car enthusiast, discover, list, and purchase vehicles quickly<br className="hidden sm:block" />
            and securely — all in one place.
          </p>
        </section>

        <div className="mb-2 sm:mb-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-700 mb-1">
            Latest Cars
          </h2>
          <div className="max-w-xl mx-auto text-gray-700 text-sm sm:text-base font-medium border-b-2 border-orange-200 pb-2">
            Discover the newest listings from our community. Find your next ride today!
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : listings.length === 0 ? (
          <p>No listings available.</p>
        ) : (
          <ul className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6">
            {listings.map((item) => (
              <li key={item.id}>
                <Link href={`/listing/${item.id}`}>
                  <div className="bg-white p-2 sm:p-4 rounded shadow hover:shadow-md transition cursor-pointer h-full flex flex-col">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        width={600}
                        height={192}
                        className="w-full h-36 sm:h-48 object-cover rounded mb-2 sm:mb-3"
                        style={{ minHeight: '9rem', background: '#eee' }}
                        priority={false}
                        placeholder="empty"
                      />
                    )}
                    <h2 className="text-base sm:text-xl font-semibold text-gray-900 line-clamp-2">
                      {item.title}
                      {item.model ? ` ${item.model}` : ''}
                    </h2>

                    {item.year && (
                      <p className="text-xs sm:text-sm font-bold text-orange-500">{item.year}</p>
                    )}


                    {(item.state || item.city) && (
                      <p className="text-xs sm:text-sm font-bold text-gray-600">
                        {item.state ? `${item.state.name} (${item.state.country_code === 'US' ? 'USA' : item.state.country_code === 'MX' ? 'Mexico' : item.state.country_code})` : ''}
                        {item.city ? `, ${item.city}` : ''}
                      </p>
                    )}

                    <p className="text-green-700 font-bold text-base sm:text-lg mt-1">
                      ${item.price}
                    </p>
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
