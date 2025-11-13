'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getCacheBuster } from '@/lib/cacheUtils'
import { generateListingTitle, generateListingDescription, generateListingKeywords, updateMetaTags, generateVehicleStructuredData, insertStructuredData } from '@/lib/seoUtils'
import { useTranslation } from '@/components/I18nProvider'
import AutoLoanCalculator from '@/components/AutoLoanCalculator'
import PriceBadge from '@/components/PriceBadge'
import SafetyRatingBadge from '@/components/SafetyRatingBadge'

// Export server-side metadata generation (runs on server even in 'use client')
export { generateListingMetadata as generateMetadata } from './metadata'

type Listing = {
  id: number
  title: string
  model: string | null
  price: number
  year: number
  transmission: string
  fuel_type: string
  vehicle_type?: string
  engine_size?: number
  mileage?: number | null
  vin?: string | null
  description: string | null
  user_id: string
  contact_by_phone: boolean
  contact_by_email: boolean
  views: number
  created_at?: string
  updated_at?: string
  state?: {
    name: string
    code: string
    country_code: string
  } | null
  city?: string | null
  brand_name?: string
  is_external?: boolean
  external_url?: string
  external_source?: string
  user_type?: string
}

type ListingImage = {
  listing_id: number
  image_url: string
}

type UserInfo = {
  full_name: string | null
  email: string | null
  phone: string | null
}

export default function ListingDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params && typeof params === 'object' && 'id' in params ? String((params as Record<string, string | string[]>).id) : '';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listing, setListing] = useState<Listing | null>(null)
  const [images, setImages] = useState<ListingImage[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownerInfo, setOwnerInfo] = useState<UserInfo | null>(null)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [showVinCopiedToast, setShowVinCopiedToast] = useState(false)
  const [vinCopiedButton, setVinCopiedButton] = useState(false)
  const hasIncrementedViews = useRef(false)

  // Helper function to translate transmission and fuel type
  const translateVehicleSpec = (value: string): string => {
    if (!value) return '';
    const lowerValue = value.toLowerCase();
    const translationKey = lowerValue as 'automatic' | 'manual' | 'gasoline' | 'diesel' | 'electric' | 'hybrid';
    return t(translationKey);
  };

  // Сброс флага при смене ID
  useEffect(() => {
    hasIncrementedViews.current = false;
  }, [id]);

  const cameFromSearch = searchParams?.get('from') === 'search';
  const cameFromMy = searchParams?.get('from') === 'my';
  const queryParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
  queryParams.delete('from');
  const backSearchUrl = `/search-results${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const handleBack = () => {
    if (cameFromMy) {
      router.push('/my-listings');
    } else if (cameFromSearch) {
      router.push(backSearchUrl);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    let cancelled = false; // Флаг для предотвращения состояния гонки

    const fetchListing = async () => {
      setLoading(true)
      setError('')

      // Add cache busting for forced listing data refresh
      const cacheBuster = getCacheBuster();
      console.log('=== DEBUGGING LISTING PAGE ===')
      console.log('Listing ID:', id)
      console.log('ID type:', typeof id)
      console.log('Cache buster:', cacheBuster)

      try {
        // Проверяем префикс "ext-" чтобы сразу идти в external_listings
        const isExternal = String(id).startsWith('ext-');
        const cleanId = isExternal ? String(id).substring(4) : id;

        console.log('Is external listing:', isExternal)
        console.log('Clean ID:', cleanId)

        // Если это external listing, сразу идём в external_listings
        if (isExternal) {
          console.log('Fetching external listing...')
          
          const { data: externalData, error: externalError } = await supabase
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
              mileage,
              vin,
              image_url,
              image_url_2,
              image_url_3,
              image_url_4,
              external_url,
              contact_phone,
              contact_email,
              source,
              state_id,
              city_id,
              city_name,
              views
            `)
            .eq('id', cleanId)
            .eq('is_active', true)
            .single()

          console.log('External listing response:')
          console.log('Data:', externalData)
          console.log('Error:', externalError)

          if (cancelled) return;

          if (externalError || !externalData) {
            console.log('Setting error state - listing not found')
            setError('Failed to load listing.')
            setLoading(false)
            return;
          }

          // Получаем данные штата отдельно, если есть state_id
          let stateObj: { name: string; code: string; country_code: string } | null = null;
          if (externalData.state_id) {
            const { data: stateData } = await supabase
              .from('states')
              .select('id, name, code, country_code')
              .eq('id', externalData.state_id)
              .single()
            
            if (stateData) {
              stateObj = { name: stateData.name, code: stateData.code, country_code: stateData.country_code };
            }
          }

          const brandName = externalData.title ? externalData.title.split(' ')[0] : undefined;

          const formattedExternal = {
            id: externalData.id,
            title: externalData.title,
            model: externalData.model,
            price: externalData.price,
            year: externalData.year,
            transmission: externalData.transmission,
            fuel_type: externalData.fuel_type,
            vehicle_type: externalData.vehicle_type,
            mileage: externalData.mileage,
            vin: externalData.vin,
            description: null, // Не показываем description для внешних объявлений
            user_id: 'external',
            contact_by_phone: true,
            contact_by_email: true,
            views: 0,
            state: stateObj,
            city: externalData.city_name,
            brand_name: brandName,
            is_external: true,
            external_url: externalData.external_url,
            external_source: externalData.source
          } as Listing & { is_external: boolean; external_url: string; external_source: string };

          setListing(formattedExternal);

          // Для external listings собираем все доступные изображения (до 4)
          const externalImages: { listing_id: number; image_url: string }[] = [];
          if (externalData.image_url) {
            externalImages.push({ listing_id: Number(id), image_url: externalData.image_url });
          }
          if (externalData.image_url_2) {
            externalImages.push({ listing_id: Number(id), image_url: externalData.image_url_2 });
          }
          if (externalData.image_url_3) {
            externalImages.push({ listing_id: Number(id), image_url: externalData.image_url_3 });
          }
          if (externalData.image_url_4) {
            externalImages.push({ listing_id: Number(id), image_url: externalData.image_url_4 });
          }
          
          if (externalImages.length > 0) {
            setImages(externalImages);
          }

          // Для external listings устанавливаем имя компании в зависимости от источника
          let companyName = 'Partner Dealer';
          if (externalData.source === 'mars_dealership') {
            companyName = 'Mars Dealership LLC';
          } else if (externalData.source === 'auto_boutique_texas') {
            companyName = 'Auto Boutique Texas';
          } else if (externalData.source === 'preowned_plus') {
            companyName = 'Pre-owned Plus';
          } else if (externalData.source === 'dick_poe_used_cars') {
            companyName = "Dick Poe's Used Car America";
          } else if (externalData.source === 'leif_johnson') {
            companyName = 'Leif Johnson Used Car Superstore';
          } else if (externalData.source === 'auto_center_texas') {
            companyName = 'Auto Center of Texas';
          }
          
          console.log('Setting external owner info:')
          console.log('Source:', externalData.source)
          console.log('Company name:', companyName)
          console.log('Email:', externalData.contact_email)
          console.log('Phone:', externalData.contact_phone)
            
          setOwnerInfo({
            full_name: companyName,
            email: externalData.contact_email || null,
            phone: externalData.contact_phone || null
          });

          setLoading(false);
          return;
        }

        // Обычное объявление из listings
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id, 
            title, 
            price, 
            year, 
            mileage, 
            transmission, 
            description, 
            vin, 
            condition, 
            vehicle_type, 
            user_id,
            state_id, 
            city_id,
            city_name,
            created_at,
            model,
            exterior_color,
            interior_color,
            fuel_type,
            drive_type,
            body_style,
            cylinders,
            engine_size,
            horse_power,
            stock_number,
            door_count,
            seating_capacity,
            states (name, code, country_code),
            cities (name)
          `)
          .eq('id', id)
          .single()

        if (error || !data) {
          console.error('Error loading listing:', error)
          setError('Listing not found.')
          setLoading(false)
          return
        }

        // Проверяем, не был ли запрос отменен
        if (cancelled) return;

        // Форматируем как на главной
        let stateObj: { name: string; code: string; country_code: string } | null = null;
        if (data.states) {
          if (Array.isArray(data.states) && data.states.length > 0 && typeof data.states[0] === 'object' && 'name' in data.states[0]) {
            stateObj = {
              name: data.states[0].name,
              code: data.states[0].code,
              country_code: data.states[0].country_code,
            };
          } else if (!Array.isArray(data.states) && typeof data.states === 'object' && 'name' in data.states) {
            const s = data.states as { name: string; code: string; country_code: string };
            stateObj = {
              name: s.name,
              code: s.code,
              country_code: s.country_code,
            };
          }
        }

        // Определяем город: если есть city_name (ручной ввод) — берём его, иначе — название из cities
        let city: string | null = null;
        if (data.city_name && data.city_name.trim()) {
          city = data.city_name.trim();
        } else if (data.cities && Array.isArray(data.cities) && data.cities[0]?.name) {
          city = data.cities[0].name;
        } else if (data.cities && typeof data.cities === 'object' && 'name' in data.cities) {
          city = (data.cities as { name: string }).name;
        }

        // Берем бренд из первого слова title (простое решение)
        const brandName = data.title ? data.title.split(' ')[0] : undefined;
        
        // Получаем user_type из user_profiles отдельным запросом
        let userType = 'individual';
        if (data.user_id) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('user_id', data.user_id)
            .single()
          
          if (profile?.user_type) {
            userType = profile.user_type;
          }
        }
        
        const formattedListing = { 
          ...data, 
          state: stateObj,
          city,
          brand_name: brandName,
          user_type: userType,
          contact_by_phone: true,
          contact_by_email: true,
          views: 0
        } as Listing;
        
        setListing(formattedListing);

        // Проверяем, не был ли запрос отменен перед загрузкой изображений
        if (cancelled) return;

        const { data: imageData } = await supabase
          .from('listing_images')
          .select('listing_id, image_url')
          .eq('listing_id', id)

        // Загружаем информацию о владельце только для обычных объявлений
        if (cancelled) return;
        
        // Не загружаем user_profiles для внешних объявлений (они уже установлены выше)
        if (data.user_id !== 'external') {
          console.log('Loading user profile for user_id:', data.user_id);
          
          const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('name, email, phone')
            .eq('user_id', data.user_id)
            .single()

          console.log('User profile query result:', userData);
          console.log('User profile query error:', userError);

          if (userData) {
            const ownerData = {
              full_name: userData.name,
              email: userData.email,
              phone: userData.phone
            };
            console.log('Setting ownerInfo:', ownerData);
            setOwnerInfo(ownerData);
          } else {
            console.log('No user profile found for user_id:', data.user_id);
          }
        }

        // Финальная проверка на отмену
        if (cancelled) return;

        // Генерируем и вставляем structured data для SEO
        try {
          const seoData = {
            id: formattedListing.id.toString(),
            title: formattedListing.title,
            model: formattedListing.model ?? undefined,
            year: formattedListing.year,
            price: formattedListing.price,
            description: formattedListing.description ?? undefined,
            state: formattedListing.state,
            image_url: imageData?.[0]?.image_url ?? undefined,
            vehicle_type: formattedListing.vehicle_type,
            brand_name: formattedListing.brand_name,
            transmission: formattedListing.transmission,
            fuel_type: formattedListing.fuel_type,
            engine_size: formattedListing.engine_size ?? undefined
          } as const;
          const structuredData = generateVehicleStructuredData(seoData);
          insertStructuredData(structuredData);
          console.log('✅ SEO structured data inserted');
        } catch (seoError) {
          console.error('Failed to insert structured data:', seoError);
          // Не прерываем загрузку страницы если SEO не сработало
        }

        setImages(imageData || [])
        setLoading(false)
      } catch (err) {
        // Проверяем, не был ли запрос отменен
        if (cancelled) return;
        
        console.error('Failed to load listing:', err)
        setError('Failed to load listing.')
        setLoading(false)
      }
    }

    if (id) {
      fetchListing()
    }

    // Cleanup функция для предотвращения состояния гонки
    return () => {
      cancelled = true;
    }
  }, [id])

useEffect(() => {
  let cancelled = false; // Флаг для предотвращения состояния гонки

  const fetchOwnerInfo = async () => {
    if (!listing?.user_id) return;
    
    // Для внешних объявлений (партнерские) - не загружаем, они уже установлены выше с предопределенными именами
    if (listing.user_id === 'external') {
      console.log('Skipping user_profiles fetch for external listing - already set with partner names');
      return;
    }

    try {
      console.log('=== FETCHING OWNER INFO FROM USER_PROFILES ===');
      console.log('User ID:', listing.user_id);

      // Для всех остальных (дилеры и обычные пользователи) - берем данные только из user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('name, phone, email')
        .eq('user_id', listing.user_id)
        .single();

      console.log('Profile data from user_profiles:', profileData);

      // Проверяем, не был ли запрос отменен
      if (cancelled) return;

      if (profileData) {
        setOwnerInfo({
          full_name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
        });
        console.log('Set owner info from user_profiles:', {
          full_name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
        });
      } else if (listing?.user_id === 'e8799652-9d86-4806-8196-a77fdfa1f84a') {
        // Fallback для конкретного пользователя
        setOwnerInfo({
          full_name: 'Mr Artur Paehn',
          phone: '55532171',
          email: '',
        });
      } else {
        console.log('No owner info found in user_profiles, setting empty');
        setOwnerInfo({
          full_name: '',
          phone: '',
          email: '',
        });
      }
    } catch (err) {
      // Проверяем, не был ли запрос отменен
      if (cancelled) return;
      
      console.error('Failed to load owner info from user_profiles:', err)
      setOwnerInfo({
        full_name: '',
        phone: '',
        email: '',
      });
    }
  }

  fetchOwnerInfo()

  // Cleanup функция для предотвращения состояния гонки
  return () => {
    cancelled = true;
  }
}, [listing])

// Инкремент счетчика просмотров
useEffect(() => {
  if (!listing || !id || hasIncrementedViews.current) {
    return;
  }

  const incrementViews = async () => {
    hasIncrementedViews.current = true; // Устанавливаем флаг до начала запроса
    
    try {
      // Используем API endpoint с service_role_key чтобы обойти RLS
      const response = await fetch('/api/increment-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          isExternal: listing.user_id === 'external'
        }),
      });

      const result = await response.json();

      if (response.ok && listing && result.newViews !== undefined) {
        // Обновляем state чтобы отобразить новое количество просмотров
        setListing({ ...listing, views: result.newViews });
      } else if (!response.ok) {
        console.error('Error incrementing views:', result.error);
      }
    } catch (err) {
      console.error('❌ Failed to increment views:', err);
    }
  };

  // Инкрементируем только один раз при загрузке
  incrementViews();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [listing?.id]); // Зависим только от listing.id, чтобы не повторять при других изменениях

// SEO мета-теги
useEffect(() => {
  if (listing && images) {
    const seoData = {
      id: listing.id.toString(),
      title: listing.title,
      model: listing.model || undefined,
      year: listing.year,
      price: listing.price,
      description: listing.description || undefined,
      state: listing.state,
      image_url: images[0]?.image_url,
      vehicle_type: listing.vehicle_type,
      brand_name: listing.brand_name,
      transmission: listing.transmission,
      fuel_type: listing.fuel_type,
      engine_size: listing.engine_size,
    };

    const title = generateListingTitle(seoData);
    const description = generateListingDescription(seoData);
    const keywords = generateListingKeywords(seoData);
    const canonicalUrl = `https://carlynx.us/listing/${listing.id}`;
    const imageUrl = images[0]?.image_url || 'https://carlynx.us/logo.png';

    updateMetaTags(title, description, keywords, imageUrl, canonicalUrl);
  }
}, [listing, images])


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">{t('loadingListingDetails')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">{t('listingNotFound')}</h3>
            <p className="text-center text-red-600">{error || t('listingNoLongerAvailable')}</p>
            <div className="mt-6 text-center">
              <button
                onClick={handleBack}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
              >
                {t('goBack')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pt-header px-2 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 bg-white/80 hover:bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {cameFromMy ? t('backToMyListings') : cameFromSearch ? t('backToSearchResults') : t('backToHome')}
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{listing.model || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{listing.year}</span>
                </div>
                {(listing.state || listing.city) && (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {listing.city && listing.state 
                        ? `${listing.city}, ${listing.state.name} (${listing.state.country_code === 'US' ? 'USA' : listing.state.country_code === 'MX' ? 'Mexico' : listing.state.country_code})`
                        : listing.city 
                        ? listing.city
                        : listing.state 
                        ? `${listing.state.name} (${listing.state.country_code === 'US' ? 'USA' : listing.state.country_code === 'MX' ? 'Mexico' : listing.state.country_code})`
                        : ''
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              {listing.price && (
                <>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-2xl sm:text-3xl font-bold text-orange-600">${listing.price.toLocaleString()}</span>
                  </div>
                  
                  {/* Price Badge */}
                  {listing.brand_name && listing.model && listing.year && (
                    <PriceBadge 
                      brand={listing.brand_name}
                      model={listing.model}
                      year={listing.year}
                      price={listing.price}
                    />
                  )}
                  
                  {/* Auto Loan Calculator Button */}
                  <button
                    onClick={() => setIsCalculatorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t('calculateAutoLoan')}
                  </button>
                </>
              )}

              {/* Views badge */}
              <div className="flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium shadow-sm">
                <svg className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {listing.views} {t('views')}
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('photos')}
          </h2>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div 
                  key={index} 
                  className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(img.image_url)}
                >
                  <Image
                    src={img.image_url}
                    alt={`Listing ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full aspect-[4/3] object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">{t('noPhotosAvailable')}</p>
              <p className="text-gray-400 text-sm">{t('sellerNoPhotos')}</p>
            </div>
          )}
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Technical Specifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('specifications')}
            </h2>
            <div className="space-y-3">
              {listing.brand_name && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('brand')}</span>
                  <span className="text-gray-900">{listing.brand_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">{t('model')}</span>
                <span className="text-gray-900">{listing.model || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">{t('year')}</span>
                <span className="text-gray-900">{listing.year}</span>
              </div>
              {listing.vehicle_type && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('vehicleType')}</span>
                  <span className="text-gray-900 capitalize">{listing.vehicle_type}</span>
                </div>
              )}
              {listing.transmission && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('transmission')}</span>
                  <span className="text-gray-900 capitalize">{translateVehicleSpec(listing.transmission)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">{t('fuelType')}</span>
                <span className="text-gray-900 capitalize">{translateVehicleSpec(listing.fuel_type)}</span>
              </div>
              {listing.mileage && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('mileage')}</span>
                  <span className="text-gray-900">{listing.mileage.toLocaleString()} miles</span>
                </div>
              )}
              {listing.vin && (
                <div className="py-2 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-gray-600 font-medium">{t('vin')}</span>
                    <div className="flex flex-col sm:items-end gap-2">
                      {/* VIN Code with Copy Button */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-mono text-sm">{listing.vin}</span>
                        {listing.vin.length === 17 && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(listing.vin!);
                              setVinCopiedButton(true);
                              setShowVinCopiedToast(true);
                              setTimeout(() => {
                                setShowVinCopiedToast(false);
                                setVinCopiedButton(false);
                              }, 2000);
                            }}
                            className={`group relative p-2 rounded-lg transition-all duration-200 ${
                              vinCopiedButton
                                ? 'text-white bg-green-600'
                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                            }`}
                            title={t('vinCopied')}
                          >
                            {vinCopiedButton ? (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* VIN Check Buttons */}
                      {listing.vin.length === 17 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 self-center mr-1">{t('checkVin')}:</span>
                          
                          {/* NICB Button */}
                          <a
                            href="https://www.nicb.org/vincheck"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            title={t('vinCheckNicbTooltip')}
                          >
                            {t('vinCheckNicb')}
                          </a>

                          {/* NHTSA Button */}
                          <a
                            href="https://www.nhtsa.gov/nhtsa-datasets-and-apis"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            title={t('vinCheckNhtsaTooltip')}
                          >
                            {t('vinCheckNhtsa')}
                          </a>

                          {/* iSeeCars Button */}
                          <a
                            href="https://www.iseecars.com/vin-check"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            title={t('vinCheckIseecarsTooltip')}
                          >
                            {t('vinCheckIseecars')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {listing.engine_size && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">{t('engineSize')}</span>
                  <span className="text-gray-900">
                    {listing.vehicle_type === 'motorcycle' 
                      ? `${listing.engine_size} cc` 
                      : `${(listing.engine_size / 1000).toFixed(1)}L`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('sellerInformation')}
            </h2>
            <div className="space-y-3">
              {listing.is_external ? (
                // External listing - show dealer info and website link
                <>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">{t('dealer')}</span>
                    <span className="text-gray-900 font-semibold">
                      {(() => {
                        const sourceMap: Record<string, string> = {
                          'mars_dealership': 'Mars Dealership',
                          'auto_boutique_texas': 'Auto Boutique Texas',
                          'auto_center_texas': 'Auto Center Texas',
                          'preowned_plus': 'PreOwned Plus',
                          'leif_johnson': 'Leif Johnson Auto Group',
                          'dream_machines_texas': 'Dream Machines of Texas'
                        };
                        return sourceMap[listing.external_source || ''] || listing.external_source || 'Dealer';
                      })()}
                    </span>
                  </div>
                  {listing.external_url && (
                    <a
                      href={(() => {
                        // Extract base URL from external_url or use default dealer websites
                        const urlMap: Record<string, string> = {
                          'mars_dealership': 'https://marsdealership.com',
                          'auto_boutique_texas': 'https://www.autoboutiquetexas.com',
                          'auto_center_texas': 'https://www.autocentertexas.com',
                          'preowned_plus': 'https://www.preownedplus.com',
                          'leif_johnson': 'https://www.leifjohnson.com',
                          'dream_machines_texas': 'https://www.dreammachinesoftexas.com'
                        };
                        
                        // Try to extract base URL from external_url
                        try {
                          const url = new URL(listing.external_url);
                          return `${url.protocol}//${url.hostname}`;
                        } catch {
                          // Fallback to predefined URLs
                          return urlMap[listing.external_source || ''] || listing.external_url;
                        }
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>{t('visitDealerWebsite')}</span>
                      </div>
                    </a>
                  )}
                </>
              ) : (
                // Regular listing - show owner name with badge based on user_type
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600 font-medium">{t('name')}</span>
                    <span className="text-gray-900">{(() => {
                      console.log('RENDER - ownerInfo:', ownerInfo);
                      return ownerInfo?.full_name || t('notProvided');
                    })()}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    {listing.user_type === 'individual' ? (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium shadow-md">
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{t('privateSeller')}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium shadow-md">
                        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                        <span>{t('dealer')}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* NHTSA Safety Rating */}
        {listing.year && listing.brand_name && listing.model && (
          <div className="mb-6">
            <SafetyRatingBadge 
              year={listing.year}
              brand={listing.brand_name}
              model={listing.model}
            />
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('description')}
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {ownerInfo && (ownerInfo.phone || ownerInfo.email) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {t('contactSeller')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* WhatsApp Button */}
              {ownerInfo.phone && (
                <a
                  href={`https://wa.me/${ownerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi! I'm interested in your ${listing.year} ${listing.brand_name || ''} ${listing.model || ''} ${listing.price ? `listed at $${listing.price.toLocaleString()}` : ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 h-full">
                    <svg className="h-6 w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-base">{t('whatsappUs')}</span>
                  </div>
                </a>
              )}

              {/* Call Button */}
              {ownerInfo.phone && (
                <a
                  href={`tel:${ownerInfo.phone}`}
                  className="block"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-2 h-full">
                    <div className="flex items-center gap-2">
                      <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-base">{t('callUs')}</span>
                    </div>
                    <span className="text-sm font-mono">{ownerInfo.phone}</span>
                  </div>
                </a>
              )}

              {/* Email Button */}
              {ownerInfo.email && (
                <a
                  href={`mailto:${ownerInfo.email}?subject=${encodeURIComponent(
                    `Interested in ${listing.year} ${listing.brand_name || ''} ${listing.model || ''}`
                  )}&body=${encodeURIComponent(
                    `Hi,\n\nI'm interested in your ${listing.year} ${listing.brand_name || ''} ${listing.model || ''} listed at $${listing.price.toLocaleString()}.\n\nPlease contact me with more details.\n\nThank you!`
                  )}`}
                  className="block"
                >
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 h-full">
                    <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base">{t('emailUs')}</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="relative max-w-4xl max-h-full">
            <Image 
              src={selectedImage} 
              alt="Full View" 
              width={1200} 
              height={800} 
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" 
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Auto Loan Calculator Modal */}
      <AutoLoanCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        vehiclePrice={listing?.price || 0}
      />

      {/* VIN Copied Toast Notification */}
      {showVinCopiedToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="font-medium">{t('vinCopiedPaste')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
