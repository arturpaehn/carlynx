"use client";
import { useState, useEffect } from 'react';
import { useTranslation } from './I18nProvider';
import { supabase } from '@/lib/supabaseClient';

export default function AveragePriceCalculator() {
  const { t } = useTranslation();
  
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [motorcycleBrands, setMotorcycleBrands] = useState<{ id: number; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ averagePrice: number; count: number } | null>(null);
  const [error, setError] = useState('');

  // Load brands on mount
  useEffect(() => {
    const loadBrands = async () => {
      const { data: carBrands } = await supabase.from('car_brands').select('id, name').order('name');
      const { data: motoBrands } = await supabase.from('motorcycle_brands').select('id, name').order('name');
      if (carBrands) setBrands(carBrands);
      if (motoBrands) setMotorcycleBrands(motoBrands);
    };
    loadBrands();
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel('');
      return;
    }

    const loadModels = async () => {
      const brandList = vehicleType === 'car' ? brands : motorcycleBrands;
      const brand = brandList.find(b => b.name === selectedBrand);
      
      if (!brand) return;

      const { data } = await supabase
        .from('car_models')
        .select('name')
        .eq('brand_id', brand.id);

      if (data) {
        const uniqueModels = Array.from(new Set(data.map(d => d.name)));
        setModels(uniqueModels);
      }
    };

    loadModels();
  }, [selectedBrand, vehicleType, brands, motorcycleBrands]);

  // Reset when vehicle type changes
  useEffect(() => {
    setSelectedBrand('');
    setSelectedModel('');
    setModels([]);
    setResult(null);
    setError('');
  }, [vehicleType]);

  const handleCalculate = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      setError(t('selectAllFields'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/calculate-average-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          model: selectedModel,
          year: parseInt(selectedYear),
          vehicleType
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.count === 0) {
          setError(t('noListingsFound'));
        } else {
          setResult(data);
        }
      } else {
        setError(data.message || 'Error calculating average price');
      }
    } catch {
      setError('Failed to calculate average price');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-700 bg-clip-text text-transparent mb-2">
          {t('averagePriceTitle')}
        </h2>
        <p className="text-gray-600 text-sm">{t('averagePriceDescription')}</p>
      </div>

      {/* Vehicle Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('vehicleType')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVehicleType('car')}
            className={`p-3 rounded-lg border-2 transition-all font-medium ${
              vehicleType === 'car'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            🚗 {t('car')}
          </button>
          <button
            type="button"
            onClick={() => setVehicleType('motorcycle')}
            className={`p-3 rounded-lg border-2 transition-all font-medium ${
              vehicleType === 'motorcycle'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            🏍️ {t('motorcycle')}
          </button>
        </div>
      </div>

      {/* Brand Selection */}
      <div className="mb-4">
        <label htmlFor="avg-brand" className="block text-sm font-semibold text-gray-700 mb-2">
          {t('brand')} <span className="text-red-500">*</span>
        </label>
        <select
          id="avg-brand"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
        >
          <option value="">{t('selectBrandAverage')}</option>
          {(vehicleType === 'car' ? brands : motorcycleBrands).map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div className="mb-4">
        <label htmlFor="avg-model" className="block text-sm font-semibold text-gray-700 mb-2">
          {t('model')} <span className="text-red-500">*</span>
        </label>
        <select
          id="avg-model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={models.length === 0}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{t('selectModelAverage')}</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Year Selection */}
      <div className="mb-6">
        <label htmlFor="avg-year" className="block text-sm font-semibold text-gray-700 mb-2">
          {t('year')} <span className="text-red-500">*</span>
        </label>
        <select
          id="avg-year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
        >
          <option value="">{t('selectYearAverage')}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={loading || !selectedBrand || !selectedModel || !selectedYear}
        className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('calculating') : t('calculate')}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-green-700 font-medium mb-1">{t('averagePrice')}</p>
            <p className="text-3xl font-bold text-green-800">
              ${result.averagePrice.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {t('basedOnListings')} {result.count} {t('listingsFound')}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}
