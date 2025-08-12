"use client";


import { useUser } from '@/hooks/useUser';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';


export default function BlockedGuard({ children }: { children: React.ReactNode }) {

  const user = useUser();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Если loading слишком долго — просто пропускаем children (fallback)
  useEffect(() => {
    if (user.loading) {
      const timer = setTimeout(() => setLoadingTimeout(true), 7000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [user.loading]);

  // Автоматический logout при блокировке
  useEffect(() => {
    if (user.blocked) {
      const timer = setTimeout(async () => {
        await supabase.auth.signOut();
        router.replace('/login');
      }, 10000); // 10 секунд
      return () => clearTimeout(timer);
    }
  }, [user.blocked, router]);



  if (user.loading && !loadingTimeout) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fff2e0] pt-40 mt-[-40px]">
        <div className="text-2xl text-orange-600 font-bold">Loading profile...</div>
      </main>
    );
  }

  if (user.loading && loadingTimeout) {
    // Fallback: если профиль не загрузился за 7 секунд — пропускаем children
    return <>{children}</>;
  }

  // Если профиль не найден и не loading — children рендерятся (или можно показать экран "Вы не авторизованы")
  if (!user.profile && !user.loading) {
    return <>{children}</>;
  }

  if (user.blocked) {
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
