'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/components/I18nProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type SubscriptionTier = {
  tier_id: string;
  tier_name: string;
  monthly_price: number;
  listing_limit: number | null;
  active: boolean;
};

export default function DealersPage() {
  const { tn } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchTiers = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('active', true)
        .order('listing_limit', { ascending: true, nullsFirst: false });

      if (!error && data) {
        setTiers(data);
      }
      setLoading(false);
    };

    fetchTiers();
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden pt-header flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </main>
    );
  }

  const getTierDetails = (tierId: string) => {
    const details: Record<string, { name: string; desc: string }> = {
      tier_100: { name: tn('dealers.tier100Name'), desc: tn('dealers.tier100Desc') },
      tier_250: { name: tn('dealers.tier250Name'), desc: tn('dealers.tier250Desc') },
      tier_500: { name: tn('dealers.tier500Name'), desc: tn('dealers.tier500Desc') },
      tier_1000: { name: tn('dealers.tier1000Name'), desc: tn('dealers.tier1000Desc') },
      tier_unlimited: { name: tn('dealers.tierUnlimitedName'), desc: tn('dealers.tierUnlimitedDesc') },
    };
    return details[tierId] || { name: tierId, desc: '' };
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden pt-header">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-orange-100/80 via-yellow-50/80 to-orange-200/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-200/30 p-8 sm:p-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-700 leading-tight py-2">
              {tn('dealers.heroTitle')}
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              {tn('dealers.heroSubtitle')}
            </p>
            <p className="max-w-3xl mx-auto text-gray-700 text-base sm:text-lg leading-relaxed mb-8">
              {tn('dealers.heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {tn('dealers.howItWorks')}
              </button>
              <a
                href={`mailto:${tn('dealers.contactEmail')}`}
                className="bg-white hover:bg-gray-50 text-orange-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl border-2 border-orange-500 transform hover:scale-105 transition-all duration-200"
              >
                {tn('dealers.contactUs')}
              </a>
            </div>
          </div>
        </section>

        {/* Why CarLynx Section */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              {tn('dealers.whyCarLynx')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: tn('dealers.whyReachBuyers'), desc: tn('dealers.whyReachBuyersDesc') },
              { icon: '📊', title: tn('dealers.whyEasyManagement'), desc: tn('dealers.whyEasyManagementDesc') },
              { icon: '📈', title: tn('dealers.whyExtraExposure'), desc: tn('dealers.whyExtraExposureDesc') },
              { icon: '💰', title: tn('dealers.whySimplePricing'), desc: tn('dealers.whySimplePricingDesc') },
              { icon: '🚪', title: tn('dealers.whyCancelAnytime'), desc: tn('dealers.whyCancelAnytimeDesc') },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              {tn('dealers.pricing')}
            </h2>
            <p className="text-gray-600 text-lg mb-2">{tn('dealers.pricingSubtitle')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
                {tiers.map((tier) => {
                  const details = getTierDetails(tier.tier_id);
                  
                  return (
                    <div
                      key={tier.tier_id}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/20 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{details.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-extrabold text-orange-600">${tier.monthly_price}</span>
                        <span className="text-gray-600">{tn('dealers.perMonth')}</span>
                      </div>
                      <div className="text-gray-700 font-semibold mb-4">
                        {tier.listing_limit 
                          ? tn('dealers.upToListings').replace('{count}', tier.listing_limit.toString())
                          : tn('dealers.unlimitedListings')
                        }
                      </div>
                      <p className="text-gray-600 text-sm">{details.desc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-gray-600 text-sm">{tn('dealers.pricingNote')}</p>
            </>
          )}
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              {tn('dealers.howItWorksTitle')}
            </h2>
            <p className="text-gray-600 text-lg">{tn('dealers.howItWorksSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { num: '1', title: tn('dealers.step1Title'), desc: tn('dealers.step1Desc'), icon: '📧' },
              { num: '2', title: tn('dealers.step2Title'), desc: tn('dealers.step2Desc'), icon: '📝' },
              { num: '3', title: tn('dealers.step3Title'), desc: tn('dealers.step3Desc'), icon: '🚗' },
              { num: '4', title: tn('dealers.step4Title'), desc: tn('dealers.step4Desc'), icon: '🚀' },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200/50 p-6 text-center">
            <p className="text-gray-700 leading-relaxed">
              {tn('dealers.howItWorksFooter')}
            </p>
          </div>
        </section>

        {/* Limits Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              {tn('dealers.limitsTitle')}
            </h3>
            <p className="text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
              {tn('dealers.limitsDescription')}
            </p>
          </div>
        </section>

        {/* Future Integration Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-blue-100/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 p-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔮</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {tn('dealers.futureIntegrationTitle')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {tn('dealers.futureIntegrationDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-orange-100/80 via-yellow-50/80 to-orange-200/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-200/30 p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              {tn('dealers.contactTitle')}
            </h2>
            <p className="text-gray-700 text-lg mb-4">
              {tn('dealers.contactDescription')}{' '}
              <a
                href={`mailto:${tn('dealers.contactEmail')}`}
                className="text-orange-600 hover:text-orange-700 font-bold underline"
              >
                {tn('dealers.contactEmail')}
              </a>{' '}
              {tn('dealers.contactFooter')}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

