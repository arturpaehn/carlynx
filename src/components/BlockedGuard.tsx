"use client";

import { useUser } from '@/hooks/useUser';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function BlockedGuard({ children }: { children: React.ReactNode }) {
  const user = useUser();

  // Если профиль ещё не загружен (undefined/null), показываем лоадер
  const router = useRouter();
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    if (user?.blocked) {
      setShowBlocked(true);
      const timer = setTimeout(async () => {
        setShowBlocked(false);
        await supabase.auth.signOut();
        router.replace('/login');
      }, 10000); // 10 секунд
      return () => clearTimeout(timer);
    } else {
      setShowBlocked(false);
    }
  }, [user?.blocked, router]);

  if (user?.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fff2e0] pt-40 mt-[-40px]">
        <div className="text-2xl text-orange-600 font-bold">Loading profile...</div>
      </main>
    );
  }


  if (showBlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fff2e0] pt-40 mt-[-40px]">
        <div className="bg-white border-2 border-red-400 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
          <div className="text-2xl text-red-600 font-bold mb-2">Your account has been blocked</div>
          <div className="text-gray-800 text-base mb-4 text-center">
            Your account was blocked due to a violation of the platform policy.<br/>
            If you believe this is a mistake, please contact support.
          </div>
          <div className="mt-2 text-gray-700 text-lg font-semibold">You will be logged out in 10 seconds.</div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
