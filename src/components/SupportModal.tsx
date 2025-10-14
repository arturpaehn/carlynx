"use client";
import { useState } from "react";
import { useTranslation } from "./I18nProvider";

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SupportModal({ open, onClose }: SupportModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('pleaseEnterValidEmail'));
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message }),
      });
      
      setLoading(false);
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(t('sendFailed'));
      }
    } catch {
      setLoading(false);
      setError(t('sendFailed'));
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setEmail("");
    setSubject("");
    setMessage("");
    setError("");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">{t('supportSuccess')}</h2>
            <p className="text-gray-600 mb-6">{t('supportSuccessDescription')}</p>
            <button
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              onClick={handleClose}
            >
              {t('closeModal')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-3">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('supportModalTitle')}</h2>
              <p className="text-sm text-gray-600 mt-1">support@carlynx.us</p>
            </div>

            <div>
              <label htmlFor="support-email" className="block text-sm font-semibold mb-2 text-gray-700">
                {t('supportEmail')} <span className="text-red-500">*</span>
              </label>
              <input
                id="support-email"
                type="email"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 transition-all"
                placeholder={t('supportEmailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="support-subject" className="block text-sm font-semibold mb-2 text-gray-700">
                {t('supportSubject')} <span className="text-red-500">*</span>
              </label>
              <input
                id="support-subject"
                type="text"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 transition-all"
                placeholder={t('supportSubjectPlaceholder')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="support-message" className="block text-sm font-semibold mb-2 text-gray-700">
                {t('supportMessage')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="support-message"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 transition-all resize-none"
                placeholder={t('supportMessagePlaceholder')}
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                onClick={handleClose}
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? t('sending') : t('send')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
