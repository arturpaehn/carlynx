"use client";
import { useState } from "react";
import { useTranslation } from "./I18nProvider";

export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    setLoading(true);
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-fade-in">
        {success ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-green-700">{t('messageSent')}</h2>
            <button
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              onClick={() => { setSuccess(false); setEmail(""); setSubject(""); setMessage(""); onClose(); }}
            >
              {t('backToHome')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-orange-700 mb-2 text-center">{t('contactCarLynx')}</h2>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold mb-1 text-gray-700">{t('yourEmail')}</label>
              <input
                id="contact-email"
                type="email"
                className="w-full border-2 border-orange-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                placeholder={t('emailExample')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-semibold mb-1 text-gray-700">{t('subject')}</label>
              <input
                id="contact-subject"
                type="text"
                className="w-full border-2 border-orange-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                placeholder={t('subjectPlaceholder')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-semibold mb-1 text-gray-700">{t('messageLabel')}</label>
              <textarea
                id="contact-message"
                className="w-full border-2 border-orange-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                placeholder={t('messagePlaceholder')}
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={onClose}
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
