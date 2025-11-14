import { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'

export async function generateListingMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  try {
    // Проверяем, это external listing или обычное
    const isExternal = String(id).startsWith('ext-')
    const cleanId = isExternal ? String(id).substring(4) : id

    if (isExternal) {
      // Получаем данные из external_listings
      const { data: listing, error } = await supabase
        .from('external_listings')
        .select(`
          id,
          title,
          model,
          price,
          year,
          transmission,
          fuel_type,
          vehicle_type,
          image_url,
          source,
          external_url
        `)
        .eq('id', cleanId)
        .eq('is_active', true)
        .single()

      if (error || !listing) {
        return {
          title: 'Listing Not Found - CarLynx',
          description: 'This listing is no longer available.',
        }
      }

      // Форматируем данные для external listing
      const imageUrl = listing.image_url || 'https://carlynx.us/logo.png'
      const title = `${listing.year} ${listing.title} - $${listing.price.toLocaleString()}`
      const description = `${listing.year} ${listing.title} for sale. ${listing.transmission} transmission, ${listing.fuel_type} fuel type. Listed by trusted partner dealer.`
      const url = `https://carlynx.us/listing/ext-${listing.id}`

      return {
        title: `${title} | CarLynx`,
        description: description.slice(0, 160),
        keywords: `${listing.title}, ${listing.year}, ${listing.model}, car for sale, ${listing.transmission}, ${listing.fuel_type}`,
        openGraph: {
          title: title,
          description: description.slice(0, 160),
          url: url,
          siteName: 'CarLynx',
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${listing.year} ${listing.title}`,
            }
          ],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: title,
          description: description.slice(0, 160),
          images: [imageUrl],
          site: '@carlynx',
        },
        alternates: {
          canonical: url,
        },
      }
    }

    // Получаем данные обычного объявления
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        model,
        price,
        year,
        transmission,
        fuel_type,
        vehicle_type,
        engine_size,
        description,
        user_id,
        contact_by_phone,
        contact_by_email,
        views,
        created_at,
        state_id,
        states (id, name, code, country_code)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    // Получаем первое изображение
    const { data: images } = await supabase
      .from('listing_images')
      .select('image_url')
      .eq('listing_id', id)
      .limit(1)

    if (error || !listing) {
      return {
        title: 'Listing Not Found - CarLynx',
        description: 'This listing is no longer available.',
      }
    }

    // Форматируем данные
    const imageUrl = images?.[0]?.image_url || 'https://carlynx.us/logo.png'
    const title = `${listing.year} ${listing.title} - $${listing.price.toLocaleString()}`
    const description = listing.description || `${listing.year} ${listing.title} for sale. ${listing.transmission} transmission, ${listing.fuel_type} fuel type.`
    const url = `https://carlynx.us/listing/${listing.id}`

    return {
      title: `${title} | CarLynx`,
      description: description.slice(0, 160), // Ограничиваем длину
      keywords: `${listing.title}, ${listing.year}, ${listing.model}, car for sale, ${listing.transmission}, ${listing.fuel_type}`,
      openGraph: {
        title: title,
        description: description.slice(0, 160),
        url: url,
        siteName: 'CarLynx',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${listing.year} ${listing.title}`,
          }
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description.slice(0, 160),
        images: [imageUrl],
        site: '@carlynx',
      },
      alternates: {
        canonical: url,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'CarLynx - Buy and Sell Cars',
      description: 'Find your perfect car on CarLynx marketplace.',
    }
  }
}
