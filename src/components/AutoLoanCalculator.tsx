'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from './I18nProvider'

interface AutoLoanCalculatorProps {
  isOpen: boolean
  onClose: () => void
  vehiclePrice: number
}

export default function AutoLoanCalculator({ isOpen, onClose, vehiclePrice }: AutoLoanCalculatorProps) {
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // State for form inputs
  const [downPayment, setDownPayment] = useState(0)
  const [loanTerm, setLoanTerm] = useState(60)
  const [apr, setApr] = useState(0)

  // State for calculated results
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [totalPayment, setTotalPayment] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)

  // Calculate recommended APR based on vehicle price, down payment, and term
  const calculateRecommendedAPR = (price: number, dp: number, term: number): number => {
    const loanAmount = Math.max(price - dp, 0)
    
    // Base rate based on price
    let baseRate = 9.49 // Default for older/cheaper cars
    if (price >= 35000) {
      baseRate = 6.49 // Newer/expensive cars
    } else if (price >= 15000) {
      baseRate = 7.99 // Mid-range
    }

    // Adjustments
    let adjustments = 0

    // Term adjustment: +0.40 per 12 months over 60
    if (term > 60) {
      const extraYears = Math.floor((term - 60) / 12)
      adjustments += extraYears * 0.40
    }

    // Small loan penalty: +0.75 if loan < 10,000
    if (loanAmount < 10000 && loanAmount > 0) {
      adjustments += 0.75
    }

    // Large down payment discount: -0.30 if DP >= 20%
    if (dp >= price * 0.20) {
      adjustments -= 0.30
    }

    // Clamp between 4.49 and 24.99
    const finalRate = Math.max(4.49, Math.min(24.99, baseRate + adjustments))
    return Math.round(finalRate * 100) / 100
  }

  // Calculate monthly payment using annuity formula
  const calculatePayments = (price: number, dp: number, term: number, rate: number) => {
    const loanAmount = Math.max(price - dp, 0)
    
    if (loanAmount === 0) {
      setMonthlyPayment(0)
      setTotalPayment(0)
      setTotalInterest(0)
      return
    }

    const monthlyRate = rate / 100 / 12

    let monthly = 0
    if (monthlyRate > 0) {
      // Annuity formula: M = r * L / (1 - (1 + r)^(-n))
      monthly = (monthlyRate * loanAmount) / (1 - Math.pow(1 + monthlyRate, -term))
    } else {
      // 0% APR case
      monthly = loanAmount / term
    }

    const total = monthly * term
    const interest = total - loanAmount

    setMonthlyPayment(monthly)
    setTotalPayment(total)
    setTotalInterest(interest)
  }

  // Track if user manually edited APR
  const [isAprManuallyEdited, setIsAprManuallyEdited] = useState(false)

  // Initialize APR and recalculate when inputs change
  useEffect(() => {
    if (isOpen) {
      // Only auto-update APR if user hasn't manually edited it
      if (!isAprManuallyEdited) {
        const recommendedAPR = calculateRecommendedAPR(vehiclePrice, downPayment, loanTerm)
        setApr(recommendedAPR)
        calculatePayments(vehiclePrice, downPayment, loanTerm, recommendedAPR)
      } else {
        // If manually edited, just recalculate with current APR
        calculatePayments(vehiclePrice, downPayment, loanTerm, apr)
      }
    }
  }, [isOpen, vehiclePrice, downPayment, loanTerm, isAprManuallyEdited, apr])

  // Reset manual edit flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAprManuallyEdited(false)
    }
  }, [isOpen])

  // Handle reset to recommended values
  const handleReset = () => {
    setDownPayment(0)
    setLoanTerm(60)
    setIsAprManuallyEdited(false)
    const recommendedAPR = calculateRecommendedAPR(vehiclePrice, 0, 60)
    setApr(recommendedAPR)
    calculatePayments(vehiclePrice, 0, 60, recommendedAPR)
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTab)
      closeButtonRef.current?.focus()

      return () => document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen])

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Handle down payment change with validation
  const handleDownPaymentChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    const clamped = Math.max(0, Math.min(vehiclePrice, numValue))
    setDownPayment(clamped)
  }

  // Handle APR change with validation
  const handleAprChange = (value: string) => {
    setIsAprManuallyEdited(true) // Mark as manually edited
    const numValue = parseFloat(value) || 0
    const clamped = Math.max(0.1, Math.min(24.99, numValue))
    setApr(clamped)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculator-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 id="calculator-title" className="text-2xl font-bold flex items-center">
              <svg className="h-7 w-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('autoLoanCalculator')}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close calculator"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-orange-100">{t('loanCalculatorDescription')}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Vehicle Price (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('loanVehiclePrice')}
            </label>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(vehiclePrice)}
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label htmlFor="down-payment" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('downPayment')}
            </label>
            <input
              id="down-payment"
              type="number"
              min="0"
              max={vehiclePrice}
              step="100"
              value={downPayment}
              onChange={(e) => handleDownPaymentChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-lg"
              placeholder={t('downPaymentPlaceholder')}
            />
          </div>

          {/* Loan Term with Slider */}
          <div>
            <label htmlFor="loan-term" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('loanTerm')}: <span className="text-orange-600 font-bold">{loanTerm}</span>
            </label>
            <input
              id="loan-term"
              type="range"
              min="12"
              max="84"
              step="12"
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12</span>
              <span>24</span>
              <span>36</span>
              <span>48</span>
              <span>60</span>
              <span>72</span>
              <span>84</span>
            </div>
          </div>

          {/* APR (Editable) */}
          <div>
            <label htmlFor="apr" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('interestRate')}
            </label>
            <input
              id="apr"
              type="number"
              min="0.1"
              max="24.99"
              step="0.01"
              value={apr}
              onChange={(e) => handleAprChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-lg"
              placeholder={t('interestRatePlaceholder')}
            />
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              {t('resetToRecommended')}
            </button>
          </div>

          {/* Results */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
            <div className="text-center mb-6">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {t('monthlyPayment')}
              </div>
              <div className="text-5xl font-bold text-orange-600">
                {formatCurrency(monthlyPayment)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600 mb-1">{t('totalPayment')}</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(totalPayment)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">{t('totalInterest')}</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(totalInterest)}</div>
              </div>
            </div>
          </div>

          {/* Lender Buttons */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t('lenderOptions')}
            </h3>
            <div className="space-y-3">
              {/* LendingTree */}
              <a
                href="https://www.lendingtree.com/auto/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-6 py-4 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 border-2 border-gray-200 hover:border-green-400 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.5 18.5L9.5 12.5L13.5 16.5L22 6M22 6H18M22 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">LendingTree</div>
                    <div className="text-sm text-gray-600">{t('compareMultipleLenders')}</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Bank of America */}
              <a
                href="https://www.bankofamerica.com/auto-loans/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-6 py-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 border-2 border-gray-200 hover:border-red-400 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-red-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-red-200 transition-colors">
                    <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">Bank of America</div>
                    <div className="text-sm text-gray-600">{t('trustedAutoFinancing')}</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* CarsDirect */}
              <a
                href="https://www.carsdirect.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-6 py-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9h-1.5c0-2.21-1.79-4-4-4H10v6H6l-3 9h12c2.21 0 4-1.79 4-4v-7zm-6 10H5.5l2-6H10v-4h3.5c1.1 0 2 .9 2 2H17v8c0 1.1-.9 2-2 2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">CarsDirect</div>
                    <div className="text-sm text-gray-600">{t('compareMultipleLenders')}</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-orange::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-orange::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-orange::-webkit-slider-runnable-track {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(to right, #fed7aa 0%, #fb923c ${((loanTerm - 12) / 72) * 100}%, #e5e7eb ${((loanTerm - 12) / 72) * 100}%, #e5e7eb 100%);
        }

        .slider-orange::-moz-range-track {
          height: 12px;
          border-radius: 6px;
          background: #e5e7eb;
        }

        .slider-orange::-moz-range-progress {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(to right, #fed7aa, #fb923c);
        }
      `}</style>
    </div>
  )
}
