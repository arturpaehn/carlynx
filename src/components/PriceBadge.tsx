'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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

  // Badge styling based on type
  const badgeStyles = {
    good: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: '💚',
      label: t('priceBadge.good') || 'Good Price'
    },
    fair: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
      icon: '👍',
      label: t('priceBadge.fair') || 'Fair Price'
    },
    high: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
      icon: '⚠️',
      label: t('priceBadge.high') || 'High Price'
    }
  };

  const style = badgeStyles[badge];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} font-medium text-sm shadow-sm ${className}`}
      title={t(`priceBadge.${badge}Description`)}
    >
      <span className="text-base">{style.icon}</span>
      <span>{style.label}</span>
    </div>
  );
}
