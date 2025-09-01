import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Cookies Policy',
  description: 'Cookies Policy for CarLynx.us - Learn about how we use cookies, manage your cookie preferences, and understand your privacy options.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Cookies Policy - CarLynx',
    description: 'Cookies Policy for CarLynx.us marketplace. Manage your cookie preferences and understand our cookie usage.',
    url: 'https://carlynx.us/cookies',
  },
  alternates: {
    canonical: 'https://carlynx.us/cookies',
  },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies & Consent">
      <div className="space-y-6">
        <p className="text-lg text-gray-800 font-medium">
          CarLynx.us uses cookies to ensure proper operation of the website and improve your user experience.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and provide a better user experience.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
          
          <div className="space-y-4">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                <span className="inline-flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Essential Cookies (Required)
                </span>
              </h3>
              <p className="text-green-800">
                These cookies are necessary for the website to function properly. They include authentication, security, and basic functionality cookies.
              </p>
              <p className="text-sm text-green-700 mt-2">
                <strong>Duration:</strong> Session and up to 30 days<br />
                <strong>Cannot be disabled</strong>
              </p>
            </div>

            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                <span className="inline-flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Functional Cookies (Optional)
                </span>
              </h3>
              <p className="text-blue-800">
                These cookies remember your preferences such as search filters, language settings, and user interface preferences.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Duration:</strong> Up to 1 year<br />
                <strong>Can be disabled</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>Note:</strong> We do not use advertising, tracking, or marketing cookies. We do not share cookie data with third parties for advertising purposes.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Managing Cookies</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Browser Settings</h3>
              <p>
                You can manage cookies through your browser settings. However, blocking essential cookies may prevent the site from functioning correctly.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a 
                  href="https://support.google.com/chrome/answer/95647" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                >
                  <span className="text-gray-700">Chrome Cookie Settings</span>
                  <svg className="h-4 w-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a 
                  href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                >
                  <span className="text-gray-700">Firefox Cookie Settings</span>
                  <svg className="h-4 w-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CarLynx Cookie Preferences</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Essential Cookies</p>
                      <p className="text-sm text-gray-600">Required for basic site functionality</p>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Always On
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Functional Cookies</p>
                      <p className="text-sm text-gray-600">Remember your preferences and settings</p>
                    </div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                    Save Preferences
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
          <p>We use the following third-party services that may set cookies:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Supabase:</strong> Authentication and database services</li>
            <li><strong>Stripe:</strong> Payment processing (only during checkout)</li>
            <li><strong>Cloudflare:</strong> Security and performance optimization</li>
          </ul>
          <p className="mt-4">
            These services have their own cookie policies. We do not control third-party cookies and recommend reviewing their privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Consent and Withdrawal</h2>
          <p>
            By continuing to use CarLynx.us, you consent to our use of cookies as described here. You can withdraw consent at any time by:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Adjusting your browser settings to block cookies</li>
            <li>Using the cookie preferences on this page</li>
            <li>Contacting us at <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Updates to Cookie Policy</h2>
          <p>
            This Cookie Policy may be updated to reflect changes in our practices or legal requirements. We will notify users of significant changes through our website or email.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. More Information</h2>
          <p>
            For more details about how we handle your personal data, please see our <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">Privacy Policy</a>.
          </p>
          <p className="mt-2">
            For questions about cookies, contact: <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a>
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
