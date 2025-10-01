"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from './I18nProvider';

export default function ActiveListingsCount() {
  const { t } = useTranslation()
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      if (isMounted && !error) setCount(count ?? 0);
    };
    fetchCount();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="inline-block bg-white/10 border border-orange-300 rounded-lg px-1.5 py-0.5 shadow text-center mt-1">
      <span className="text-xs font-bold text-orange-200">{t('activeListings')}&nbsp;</span>
      <span className="text-xs font-bold text-green-200">{count !== null ? count : '...'}</span>
    </div>
  );
}
