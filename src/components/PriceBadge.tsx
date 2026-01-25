'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from './I18nProvider';

interface PriceBadgeProps {
  brand: string | null | undefined;
  model: string | null | undefined;
  year: number | null | undefined;
  price: number | null | undefined;
  className?: string;
}

type BadgeType = 'good' | 'fair' | 'high' | null;

/**
 * PriceBadge Component
 * 
 * Displays a price quality badge (Good/Fair/High) by comparing 
 * the listing price with market average for the same brand/model/year.
 * 
 * Badge logic:
 * - Good (green): Price < 80% of average (great deal!)
 * - Fair (blue): Price 80-120% of average (normal market price)
 * - High (orange): Price > 120% of average (above market)
 * 
 * @param brand - Vehicle brand (e.g., "Toyota", "Ford")
 * @param model - Vehicle model (e.g., "Camry", "F-150")
 * @param year - Model year (e.g., 2020)
 * @param price - Listing price in USD
 * @param className - Optional CSS classes
 */
export default function PriceBadge({ brand, model, year, price, className = '' }: PriceBadgeProps) {
  const { tn } = useTranslation();
  const [badge, setBadge] = useState<BadgeType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPriceBadge() {
      // Validate input
      if (!brand || !model || !year || !price || price <= 0) {
        console.log('[PriceBadge] Missing data:', { brand, model, year, price });
        setLoading(false);
        return;
      }

      console.log('[PriceBadge] Fetching badge for:', { brand, model, year, price });

      try {
        // Call the database function to get price badge
        const { data, error } = await supabase.rpc('get_price_badge', {
          p_brand: brand,
          p_model: model,
          p_year: year,
          p_price: price
        });

        if (error) {
          console.error('[PriceBadge] Error:', error);
          setBadge(null);
        } else {
          console.log('[PriceBadge] Result:', data);
          setBadge(data as BadgeType);
        }
      } catch (err) {
        console.error('[PriceBadge] Exception:', err);
        setBadge(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPriceBadge();
  }, [brand, model, year, price]);

  // Don't render anything while loading or if no badge data
  if (loading || !badge) {
    return null;
  }

  // Badge styling based on type (modern minimalist design)
  const badgeStyles = {
    good: {
      bg: 'bg-green-500',
      text: 'text-white',
      border: 'border-green-500',
      label: 'GOOD'
    },
    fair: {
      bg: 'bg-blue-500',
      text: 'text-white',
      border: 'border-blue-500',
      label: 'FAIR'
    },
    high: {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-500',
      label: 'HIGH'
    }
  };

  const style = badgeStyles[badge];

  return (
    <div
      className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${style.bg} ${style.text} ${className}`}
      title={tn(`priceBadge.${badge}Description`)}
    >
      {style.label}
    </div>
  );
}
