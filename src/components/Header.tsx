"use client";
import Link from 'next/link'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useTranslation } from '@/components/I18nProvider'
// Админ email-ы (как в admin/page.tsx)
const adminEmails = ["admin@carlynx.us"];

export default function Header() {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const headerRef = useRef<HTMLElement>(null);
  // Green info bar announcements
  const announcements = [
    t('announcement1'),
    t('announcement2'),
    t('announcement3')
  ];
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
        setFade(true);
      }, 400); // fade out duration
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [fullName, setFullName] = useState<string | null>(null)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  // Новые поля для поддержки мотоциклов
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | ''>('')
  const [engineSizeMin, setEngineSizeMin] = useState('')
  const [engineSizeMax, setEngineSizeMax] = useState('')
  // Штаты и города для поиска
  const [states, setStates] = useState<{ id: number; name: string; code: string; country_code: string }[]>([])
  const [selectedStates, setSelectedStates] = useState<number[]>([])
  const [cities, setCities] = useState<{ id: number; name: string; state_id: number }[]>([])
  const [cityInput, setCityInput] = useState('')
  const [cityExact, setCityExact] = useState(false)
  const [showStatesDropdown, setShowStatesDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const statesBtnRef = useRef<HTMLButtonElement>(null);

  // Функция для обновления высоты Header'а
  const updateHeaderHeight = () => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--header-height', `${height}px`);
      console.log('Header height updated:', height); // Для отладки
    }
  };

  // Обновляем высоту при монтировании и изменении размера окна
  useEffect(() => {
    // Используем setTimeout чтобы дать время хэдеру отрендериться
    const timer = setTimeout(() => {
      updateHeaderHeight();
    }, 100);
    
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Обновляем высоту при изменении состояния поиска (когда открывается/закрывается панель поиска)
  useEffect(() => {
    // Даем время для анимации панели поиска
    const timer = setTimeout(() => {
      updateHeaderHeight();
    }, 50);
    return () => clearTimeout(timer);
  }, [searchOpen]);
  // Загружать города при выборе штата(ов)
  useEffect(() => {
    if (!selectedStates.length) {
      setCities([]);
      setCityInput('');
      return;
    }
    const fetchCities = async () => {
      // Получаем города для всех выбранных штатов
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, state_id')
        .in('state_id', selectedStates);
      if (!error && data) {
        setCities(data);
      } else {
        setCities([]);
      }
      setCityInput('');
    };
    fetchCities();
  }, [selectedStates, supabase]);
  // Проверка на админа (по email)
  const user = session?.user;
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }
      // Получаем email из supabase.auth.getUser() для точности
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email || user.email;
      setIsAdmin(adminEmails.includes(email));
    };
    checkAdmin();
  }, [user, supabase]);

  // Закрывать дропдаун при клике вне и вычислять позицию
  useEffect(() => {
    if (showStatesDropdown) {
      // Позиционируем dropdown
      const btn = statesBtnRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      // Клик вне
      const handler = (e: MouseEvent) => {
        const dropdown = document.getElementById('states-dropdown');
        if (dropdown && !dropdown.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
          setShowStatesDropdown(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showStatesDropdown]);
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [transmission, setTransmission] = useState('')
  const [fuelType, setFuelType] = useState('')

  const [years, setYears] = useState<number[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [motorcycleBrands, setMotorcycleBrands] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])

  // удалено дублирование user

  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();
      if (!error && data?.name) {
        setFullName(data.name);
      } else {
        setFullName(user.email || 'User');
      }
    };
    fetchProfileName();
  }, [user, supabase]);


  const handleLogout = async () => {
    setLoading(true)
    
    try {
      // Очистить локальное состояние
      setFullName(null)
      setIsAdmin(false)
      
      // Выйти из Supabase
      await supabase.auth.signOut()
      
      // Простой редирект без конфликтов
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // В случае ошибки просто перенаправляем
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

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

    const fetchMotorcycleBrands = async () => {
      const { data, error } = await supabase.from('motorcycle_brands').select('name')
      if (!error && data) {
        setMotorcycleBrands(data.map(b => b.name))
      }
    }

    const fetchStates = async () => {
      const { data, error } = await supabase.from('states').select('id, name, code, country_code')
      if (!error && data) {
        setStates(data)
      }
    }

    fetchBrands()
    fetchMotorcycleBrands()
    fetchStates()
  }, [supabase])

  useEffect(() => {
    const fetchModels = async () => {
      if (!brand) {
        setModels([])
        return;
      }

      // Определяем, из какой таблицы искать бренд
      let brandData = null
      
      if (vehicleType === 'motorcycle') {
        const { data } = await supabase
          .from('motorcycle_brands')
          .select('id')
          .eq('name', brand)
          .single()
        brandData = data
      } else {
        // По умолчанию ищем в автомобильных брендах (обратная совместимость)
        const { data } = await supabase
          .from('car_brands')
          .select('id')
          .eq('name', brand)
          .single()
        brandData = data
      }

      if (!brandData) {
        setModels([])
        return;
      }

      // У мотоциклов пока нет отдельной таблицы моделей, 
      // поэтому оставляем models пустым для мотоциклов
      if (vehicleType === 'motorcycle') {
        setModels([])
        return;
      }

      // Для автомобилей загружаем модели как раньше
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
  }, [brand, vehicleType, supabase])

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    // Основные параметры
    if (vehicleType) params.append('vehicle_type', vehicleType)
    if (brand) params.append('brand', brand)
    if (model) params.append('model', model)
    if (priceMin) params.append('price_min', priceMin)
    if (priceMax) params.append('price_max', priceMax)
    
    // Engine size (только если указан vehicle_type)
    if (engineSizeMin) params.append('engine_size_min', engineSizeMin)
    if (engineSizeMax) params.append('engine_size_max', engineSizeMax)
    
    // Местоположение
    if (selectedStates.length > 0) {
      selectedStates.forEach(id => params.append('state_id', String(id)))
    }
    if (cityInput) {
      if (cityExact) {
        const match = cities.find(city => city.name === cityInput);
        if (match) {
          params.append('city_id', String(match.id));
        } else {
          params.append('city', cityInput);
        }
      } else {
        params.append('city', cityInput);
      }
    }
    
    // Дополнительные параметры
    if (minYear) params.append('year_min', minYear)
    if (maxYear) params.append('year_max', maxYear)
    
    // Transmission только для автомобилей
    if (vehicleType !== 'motorcycle' && transmission) params.append('transmission', transmission)
    if (fuelType) params.append('fuel_type', fuelType)

    router.push(`/search-results?${params.toString()}`)
    setSearchOpen(false)
  }

  return (
    <header ref={headerRef} className="relative top-0 left-0 w-full z-50">
      {/* Эффектная зелёная инфо-секция с анимацией */}
      <div
        className="w-full flex items-center justify-center px-2 py-2 md:py-3"
        style={{
          background: 'linear-gradient(90deg, #2e7d32 0%, #388e3c 100%)',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 6px 24px 0 rgba(46,125,50,0.18)',
          minHeight: '3.2em',
        }}
      >
  <span className="flex items-center gap-3 w-full max-w-3xl mx-auto text-white text-center text-base md:text-lg font-semibold tracking-wide select-none justify-center">
          <svg className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0 opacity-95" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2.2" fill="#388e3c" />
            <path stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
          </svg>
          <span
            className={`block transition-all duration-600 ease-in-out ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            style={{ transition: 'opacity 0.6s, transform 0.6s' }}
            dangerouslySetInnerHTML={{
              __html: announcements[announcementIndex]
                .replace(
                  'Currently FREE', 
                  '<span style="color: #fbbf24; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">Currently FREE</span>'
                )
                .replace(
                  'zero fees',
                  '<span style="color: #fbbf24; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">zero fees</span>'
                )
                .replace(
                  '$5',
                  '<span style="color: #fbbf24; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">$5</span>'
                )
            }}
          />
        </span>
      </div>
  <div className="bg-[#ffe6cc] shadow border-b flex flex-col items-center justify-center py-3 md:py-6 space-y-2 md:space-y-4 w-full relative">
        {/* Language switcher - positioned absolutely in top left corner */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-1 z-10">
          <button
            onClick={() => setLanguage('en')}
            className={`w-10 h-6 md:w-12 md:h-8 flex items-center justify-center rounded border-2 transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden ${
              currentLanguage === 'en' 
                ? 'border-orange-500 scale-110' 
                : 'border-gray-300 hover:border-orange-300'
            }`}
            title="English"
          >
            {/* US Flag SVG */}
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <defs>
                <pattern id="stripes" patternUnits="userSpaceOnUse" width="60" height="2.31">
                  <rect width="60" height="1.15" fill="#B22234"/>
                  <rect width="60" height="1.15" y="1.15" fill="#FFFFFF"/>
                </pattern>
              </defs>
              <rect width="60" height="30" fill="url(#stripes)"/>
              <rect width="24" height="17" fill="#3C3B6E"/>
              <g fill="#FFFFFF">
                <circle cx="3" cy="2" r="0.5"/>
                <circle cx="7" cy="2" r="0.5"/>
                <circle cx="11" cy="2" r="0.5"/>
                <circle cx="15" cy="2" r="0.5"/>
                <circle cx="19" cy="2" r="0.5"/>
                <circle cx="5" cy="4" r="0.5"/>
                <circle cx="9" cy="4" r="0.5"/>
                <circle cx="13" cy="4" r="0.5"/>
                <circle cx="17" cy="4" r="0.5"/>
                <circle cx="21" cy="4" r="0.5"/>
                <circle cx="3" cy="6" r="0.5"/>
                <circle cx="7" cy="6" r="0.5"/>
                <circle cx="11" cy="6" r="0.5"/>
                <circle cx="15" cy="6" r="0.5"/>
                <circle cx="19" cy="6" r="0.5"/>
                <circle cx="5" cy="8" r="0.5"/>
                <circle cx="9" cy="8" r="0.5"/>
                <circle cx="13" cy="8" r="0.5"/>
                <circle cx="17" cy="8" r="0.5"/>
                <circle cx="21" cy="8" r="0.5"/>
                <circle cx="3" cy="10" r="0.5"/>
                <circle cx="7" cy="10" r="0.5"/>
                <circle cx="11" cy="10" r="0.5"/>
                <circle cx="15" cy="10" r="0.5"/>
                <circle cx="19" cy="10" r="0.5"/>
                <circle cx="5" cy="12" r="0.5"/>
                <circle cx="9" cy="12" r="0.5"/>
                <circle cx="13" cy="12" r="0.5"/>
                <circle cx="17" cy="12" r="0.5"/>
                <circle cx="21" cy="12" r="0.5"/>
                <circle cx="3" cy="14" r="0.5"/>
                <circle cx="7" cy="14" r="0.5"/>
                <circle cx="11" cy="14" r="0.5"/>
                <circle cx="15" cy="14" r="0.5"/>
                <circle cx="19" cy="14" r="0.5"/>
              </g>
            </svg>
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`w-10 h-6 md:w-12 md:h-8 flex items-center justify-center rounded border-2 transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden ${
              currentLanguage === 'es' 
                ? 'border-orange-500 scale-110' 
                : 'border-gray-300 hover:border-orange-300'
            }`}
            title="Español"
          >
            {/* Mexico Flag SVG */}
            <svg viewBox="0 0 60 30" className="w-full h-full">
              <rect width="20" height="30" fill="#006847"/>
              <rect x="20" width="20" height="30" fill="#FFFFFF"/>
              <rect x="40" width="20" height="30" fill="#CE1126"/>
              <g transform="translate(30,15)">
                <circle r="4" fill="#8B4513"/>
                <path d="M-2,-2 L2,-2 L1,2 L-1,2 Z" fill="#228B22"/>
                <circle r="1" fill="#FFD700"/>
              </g>
            </svg>
          </button>
        </div>
        {/* Facebook floating button - positioned absolutely in top right corner */}
        <a 
          href="https://www.facebook.com/profile.php?id=61579875194260" 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
          title="Visit our Facebook page"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <div className="relative w-full flex flex-col items-center">
          <Link href="/">
            <Image src="/logo.png" alt="CarLynx Logo" width={128} height={128} className="h-16 w-auto md:h-32 transition-all mx-auto" priority />
          </Link>
          {/* Language switcher removed */}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full px-1 md:px-0 mt-2">
          {/* Useful Info link always last */}
          <Link href="/info" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium whitespace-nowrap min-w-0 max-w-[160px] text-center order-last hidden sm:inline-block hover:scale-105">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              {t('usefulInformation')}
            </span>
          </Link>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105"
          >
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('search')}
            </span>
          </button>

          {user ? (
            <>
              <div className="flex items-center bg-gradient-to-r from-orange-100/80 via-yellow-50/80 to-orange-200/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-orange-200/50">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-orange-600 font-medium">{t('welcomeBack')}</span>
                    <span className="text-sm md:text-base font-bold bg-gradient-to-r from-orange-700 via-yellow-600 to-orange-800 bg-clip-text text-transparent leading-tight">
                      {fullName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop buttons */}
              <div className="hidden sm:flex gap-2">
                {isAdmin && (
                  <Link href="/admin" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('admin')}
                    </span>
                  </Link>
                )}
                <Link href="/profile" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('myProfile')}
                  </span>
                </Link>
                <Link href="/add-listing" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('addListing')}
                  </span>
                </Link>
                <Link href="/my-listings" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {t('myListings')}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium disabled:opacity-50 hover:scale-105 disabled:hover:scale-100"
                >
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {loading ? t('loggingOut') : t('logOut')}
                  </span>
                </button>
              </div>

              {/* Mobile burger menu */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105"
                  aria-label="Open menu"
                >
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    ≡
                  </span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 flex flex-col">
                    {isAdmin && (
                      <Link href="/admin" className="px-4 py-2 hover:bg-blue-100 text-blue-700 font-semibold" onClick={() => setShowMenu(false)}>
                        {t('admin')}
                      </Link>
                    )}
                    <Link href="/profile" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      {t('myProfile')}
                    </Link>
                    <Link href="/add-listing" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      {t('addListing')}
                    </Link>
                    <Link href="/my-listings" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      {t('myListings')}
                    </Link>
                    <Link href="/info" className="px-4 py-2 hover:bg-green-100 text-green-700 font-semibold" onClick={() => setShowMenu(false)}>
                      {t('usefulInformation')}
                    </Link>
                    <button
                      onClick={() => { setShowMenu(false); handleLogout(); }}
                      className="px-4 py-2 text-left hover:bg-orange-100"
                    >
                      {loading ? t('loggingOut') : t('logOut')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex gap-2">
                <Link href="/login" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {t('login')}
                  </span>
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {t('register')}
                  </span>
                </Link>
              </div>
              <div className="relative sm:hidden">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-105"
                  aria-label="Open menu"
                >
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    ≡
                  </span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 flex flex-col">
                    <Link href="/login" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      {t('login')}
                    </Link>
                    <Link href="/register" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      {t('register')}
                    </Link>
                    <Link href="/info" className="px-4 py-2 hover:bg-green-100 text-green-700 font-semibold" onClick={() => setShowMenu(false)}>
                      {t('usefulInformation')}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {searchOpen && (
          <div className="w-full max-w-5xl bg-white p-2 md:p-4 rounded shadow mt-2 md:mt-4 flex flex-col md:flex-row md:flex-wrap gap-2 overflow-y-auto md:overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 justify-start md:justify-center max-h-[80vh]">
            
            {/* Vehicle Type Selection */}
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <select 
                value={vehicleType} 
                onChange={(e) => {
                  const newType = e.target.value as 'car' | 'motorcycle' | '';
                  setVehicleType(newType);
                  // Сбрасываем зависимые поля при смене типа транспорта
                  setBrand('');
                  setModel('');
                  setTransmission('');
                  setEngineSizeMin('');
                  setEngineSizeMax('');
                }}
                className="p-2 border rounded min-w-[140px] text-xs md:text-base flex-1 bg-orange-50 border-orange-300"
              >
                <option value="">{t('allVehicles')}</option>
                <option value="car">{t('cars')}</option>
                <option value="motorcycle">{t('motorcycles')}</option>
              </select>
            </div>

            {/* Brand and Model */}
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input 
                type="text" 
                placeholder={vehicleType === 'motorcycle' ? t('motorcycleBrand') : t('carBrand')} 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)} 
                list="brand-list" 
                className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" 
              />
              <datalist id="brand-list">
                {(vehicleType === 'motorcycle' ? motorcycleBrands : brands).map((b) => 
                  <option key={b} value={b} />
                )}
              </datalist>

              <input 
                type="text" 
                placeholder={t('model')} 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
                list="model-list" 
                className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" 
                disabled={models.length === 0 || vehicleType === 'motorcycle'} 
              />
              <datalist id="model-list">{models.map((m) => <option key={m} value={m} />)}</datalist>
              {vehicleType === 'motorcycle' && (
                <p className="text-xs text-gray-500 mt-1 flex-1">{t('modelNotAvailableMotorcycles')}</p>
              )}
            </div>

            {/* Price Range */}
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input type="number" placeholder={t('minPrice')} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="p-2 border rounded min-w-[100px] text-xs md:text-base flex-1" />
              <input type="number" placeholder={t('maxPrice')} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="p-2 border rounded min-w-[100px] text-xs md:text-base flex-1" />
            </div>

            {/* Engine Size (show only if vehicle type is selected) */}
            {vehicleType && (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <input 
                  type="number" 
                  placeholder={vehicleType === 'motorcycle' ? t('minCC') : t('minLiters')} 
                  value={engineSizeMin} 
                  onChange={(e) => setEngineSizeMin(e.target.value)} 
                  className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" 
                  step={vehicleType === 'motorcycle' ? "50" : "0.1"}
                />
                <input 
                  type="number" 
                  placeholder={vehicleType === 'motorcycle' ? t('maxCC') : t('maxLiters')} 
                  value={engineSizeMax} 
                  onChange={(e) => setEngineSizeMax(e.target.value)} 
                  className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" 
                  step={vehicleType === 'motorcycle' ? "50" : "0.1"}
                />
              </div>
            )}

            {/* Location */}
            <div className="flex flex-col md:flex-row gap-2 w-full">
              {/* Дропдаун со штатами */}
              <div className="relative min-w-[160px] flex-1">
                <button
                  type="button"
                  ref={statesBtnRef}
                  className="p-2 border rounded w-full text-left bg-gray-50 text-xs md:text-base flex items-center justify-between"
                  onClick={() => setShowStatesDropdown(v => !v)}
                >
                  <span>
                    {selectedStates.length === 0
                      ? t('selectStates')
                      : states
                          .filter(s => selectedStates.includes(s.id))
                          .map(s => `${s.name} (${s.country_code === 'US' ? 'USA' : s.country_code === 'MX' ? 'Mexico' : s.country_code})`)
                          .join(', ')
                    }
                  </span>
                  <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showStatesDropdown && (
                  <div
                    id="states-dropdown"
                    className="fixed max-h-60 overflow-y-auto border rounded bg-white z-[999] shadow-lg flex flex-col gap-1"
                    style={{
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: dropdownPos.width
                    }}
                  >
                    <div className="flex justify-between items-center mb-2 px-2 pt-2">
                      <span className="font-semibold text-base">{t('selectStates')}</span>
                      <button onClick={() => setShowStatesDropdown(false)} className="text-gray-500 hover:text-red-600 text-xl font-bold">×</button>
                    </div>
                    {states.map((state) => (
                      <label key={state.id} className="flex items-center gap-2 px-2 py-1 text-xs md:text-base hover:bg-orange-50 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(state.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedStates(prev => [...prev, state.id])
                            } else {
                              setSelectedStates(prev => prev.filter(id => id !== state.id))
                            }
                          }}
                        />
                      {state.name} ({state.country_code === 'US' ? 'USA' : state.country_code === 'MX' ? 'Mexico' : state.country_code})
                      </label>
                    ))}
                    <button
                      onClick={() => setShowStatesDropdown(false)}
                      className="mt-2 mb-2 mx-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium hover:scale-105"
                    >
                      <span className="inline-flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('apply')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              {/* Поле город появляется только если выбран штат */}
              {selectedStates.length > 0 && (
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    placeholder={t('cityOptional')}
                    value={cityInput}
                    onChange={e => {
                      setCityInput(e.target.value);
                      const match = cities.find(city => city.name === e.target.value);
                      setCityExact(!!match);
                    }}
                    list="city-list"
                    className="p-2 border rounded w-full text-xs md:text-base"
                    autoComplete="off"
                  />
                  <datalist id="city-list">
                    {cities.map(city => (
                      <option key={city.id} value={city.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">{t('startTypingCity')}</p>
                </div>
              )}
              <select value={minYear} onChange={e => setMinYear(e.target.value)} className="p-2 border rounded min-w-[90px] text-xs md:text-base flex-1">
                <option value="">{t('yearFrom')}</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={maxYear} onChange={e => setMaxYear(e.target.value)} className="p-2 border rounded min-w-[90px] text-xs md:text-base flex-1">
                <option value="">{t('yearTo')}</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              {/* Transmission только для автомобилей */}
              {vehicleType !== 'motorcycle' && (
                <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="p-2 border rounded min-w-[110px] text-xs md:text-base flex-1">
                  <option value="">{t('transmission')}</option>
                  <option value="manual">{t('manual')}</option>
                  <option value="automatic">{t('automatic')}</option>
                </select>
              )}
              {/* Fuel Type - обновляем опции для мотоциклов */}
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="p-2 border rounded min-w-[110px] text-xs md:text-base flex-1">
                <option value="">{t('fuelType')}</option>
                {vehicleType === 'motorcycle' ? (
                  <>
                    <option value="gasoline">{t('gasoline')}</option>
                    <option value="electric">{t('electric')}</option>
                  </>
                ) : (
                  <>
                    <option value="gasoline">{t('gasoline')}</option>
                    <option value="diesel">{t('diesel')}</option>
                    <option value="hybrid">{t('hybrid')}</option>
                    <option value="electric">{t('electric')}</option>
                    <option value="cng">{t('compressedGas')}</option>
                    <option value="lpg">{t('liquefiedGas')}</option>
                  </>
                )}
              </select>
            </div>
            <button onClick={applyFilters} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[90px] text-xs md:text-base w-full md:w-auto font-medium hover:scale-105">
              <span className="inline-flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('apply')}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
