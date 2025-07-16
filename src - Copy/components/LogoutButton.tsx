'use client'

import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh() // Обновит текущую страницу (в т.ч. user)
  }

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 hover:underline text-sm"
    >
      Log out
    </button>
  )
}
