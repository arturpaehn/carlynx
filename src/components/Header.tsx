"use client";
import Link from 'next/link'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
// Админ email-ы (как в admin/page.tsx)
const adminEmails = ["admin@carlynx.us"];

export default function Header() {
  // i18n удалён
  // Green info bar announcements
  const announcements = [
    'Welcome! CarLynx launched in August, 2025. Posting listings is free until September 15, 2025.',
    'This is a test period to help us find and fix any issues. No fees will be charged during this time.',
    'All new listings after September 15, 2025 will require payment. Thank you for helping us improve!'
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
  // Штаты и города для поиска
  const [states, setStates] = useState<{ id: number; name: string; code: string; country_code: string }[]>([])
  const [selectedStates, setSelectedStates] = useState<number[]>([])
  const [cities, setCities] = useState<{ id: number; name: string; state_id: number }[]>([])
  const [cityInput, setCityInput] = useState('')
  const [cityExact, setCityExact] = useState(false)
  const [showStatesDropdown, setShowStatesDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const statesBtnRef = useRef<HTMLButtonElement>(null);
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

    const fetchStates = async () => {
      const { data, error } = await supabase.from('states').select('id, name, code, country_code')
      if (!error && data) {
        setStates(data)
      }
    }

    fetchBrands()
    fetchStates()
  }, [supabase])

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
    if (minYear) params.append('year_min', minYear)
    if (maxYear) params.append('year_max', maxYear)
    if (transmission) params.append('transmission', transmission)
    if (fuelType) params.append('fuel_type', fuelType)

    router.push(`/search-results?${params.toString()}`)
    setSearchOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50">
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
          >
            {announcements[announcementIndex]}
          </span>
        </span>
      </div>
  <div className="bg-[#ffe6cc] shadow border-b flex flex-col items-center justify-center py-3 md:py-6 space-y-2 md:space-y-4 w-full">
        <div className="relative w-full flex flex-col items-center">
          <Link href="/">
            <Image src="/logo.png" alt="CarLynx Logo" width={128} height={128} className="h-16 w-auto md:h-32 transition-all mx-auto" priority />
          </Link>
          {/* Language switcher removed */}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full px-1 md:px-0 mt-2">
          {/* ...existing links... */}
          {/* Useful Info link always last */}
          {/* Useful Info: desktop only, hidden on mobile */}
          <Link href="/info" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm whitespace-nowrap min-w-0 max-w-[160px] text-center order-last hidden sm:inline-block">
            Useful Info
          </Link>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Search
          </button>

          {user ? (
            <>
              <span className="text-gray-800 text-base md:text-lg font-semibold italic drop-shadow-sm">
                Hi, {fullName}
              </span>

              {/* Desktop buttons */}
              <div className="hidden sm:flex gap-2">
                {isAdmin && (
                  <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm">
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm">
                  My Profile
                </Link>
                <Link href="/add-listing" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm">
                  Add Listing
                </Link>
                <Link href="/my-listings" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm">
                  My Listings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm disabled:opacity-50"
                >
                  {loading ? 'Logging out...' : 'Log out'}
                </button>
              </div>

              {/* Mobile burger menu */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded shadow text-sm"
                  aria-label="Open menu"
                >
                  ≡
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 flex flex-col">
                    {isAdmin && (
                      <Link href="/admin" className="px-4 py-2 hover:bg-blue-100 text-blue-700 font-semibold" onClick={() => setShowMenu(false)}>
                        Admin
                      </Link>
                    )}
                    <Link href="/profile" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      My Profile
                    </Link>
                    <Link href="/add-listing" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      Add Listing
                    </Link>
                    <Link href="/my-listings" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      My Listings
                    </Link>
                    <Link href="/info" className="px-4 py-2 hover:bg-green-100 text-green-700 font-semibold" onClick={() => setShowMenu(false)}>
                      Useful Info
                    </Link>
                    <button
                      onClick={() => { setShowMenu(false); handleLogout(); }}
                      className="px-4 py-2 text-left hover:bg-orange-100"
                    >
                      {loading ? 'Logging out...' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex gap-2">
                <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow text-sm">
                  Register
                </Link>
              </div>
              <div className="relative sm:hidden">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded shadow text-sm"
                  aria-label="Open menu"
                >
                  ≡
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 flex flex-col">
                    <Link href="/login" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      Login
                    </Link>
                    <Link href="/register" className="px-4 py-2 hover:bg-orange-100" onClick={() => setShowMenu(false)}>
                      Register
                    </Link>
                    <Link href="/info" className="px-4 py-2 hover:bg-green-100 text-green-700 font-semibold" onClick={() => setShowMenu(false)}>
                      Useful Info
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {searchOpen && (
          <div className="w-full max-w-5xl bg-white p-2 md:p-4 rounded shadow mt-2 md:mt-4 flex flex-col md:flex-row md:flex-wrap gap-2 overflow-y-auto md:overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 justify-start md:justify-center max-h-[80vh]">
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input type="text" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} list="brand-list" className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" />
              <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>

              <input type="text" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} list="model-list" className="p-2 border rounded min-w-[120px] text-xs md:text-base flex-1" disabled={models.length === 0} />
              <datalist id="model-list">{models.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <input type="number" placeholder="Min Price" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="p-2 border rounded min-w-[100px] text-xs md:text-base flex-1" />
              <input type="number" placeholder="Max Price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="p-2 border rounded min-w-[100px] text-xs md:text-base flex-1" />
            </div>
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
                      ? 'Select state(s)'
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
                      <span className="font-semibold text-base">Select state(s)</span>
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
                      className="mt-2 mb-2 mx-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >Apply</button>
                  </div>
                )}
              </div>
              {/* Поле город появляется только если выбран штат */}
              {selectedStates.length > 0 && (
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    placeholder="City (optional)"
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
                  <p className="text-xs text-gray-500 mt-1">Start typing to choose a city</p>
                </div>
              )}
              <select value={minYear} onChange={e => setMinYear(e.target.value)} className="p-2 border rounded min-w-[90px] text-xs md:text-base flex-1">
                <option value="">Year from</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={maxYear} onChange={e => setMaxYear(e.target.value)} className="p-2 border rounded min-w-[90px] text-xs md:text-base flex-1">
                <option value="">Year to</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="p-2 border rounded min-w-[110px] text-xs md:text-base flex-1">
                <option value="">Transmission</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="p-2 border rounded min-w-[110px] text-xs md:text-base flex-1">
                <option value="">Fuel Type</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
                <option value="cng">Compressed Gas</option>
                <option value="lpg">Liquefied Gas</option>
              </select>
            </div>
            <button onClick={applyFilters} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded min-w-[90px] text-xs md:text-base w-full md:w-auto">
              Apply
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
