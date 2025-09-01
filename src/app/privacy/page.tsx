import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for CarLynx.us - Learn how we collect, use, and protect your personal data when using our car and motorcycle marketplace platform.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy - CarLynx',
    description: 'Privacy Policy for CarLynx.us marketplace. Understanding how we handle your personal data and privacy.',
    url: 'https://carlynx.us/privacy',
  },
  alternates: {
    canonical: 'https://carlynx.us/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <div className="space-y-6">
        <p className="text-lg text-gray-800 font-medium">
          This Privacy Policy explains how <strong>SYNTARIS DIGITAL OÜ</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;) collects, uses, and protects your personal data when you use CarLynx.us.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account information:</strong> Name, email address, password (hashed)</li>
            <li><strong>Payment information:</strong> Processed via Stripe; we do not store credit card data</li>
            <li><strong>Technical information:</strong> IP address, browser type, access logs via Cloudflare</li>
            <li><strong>Content:</strong> Vehicle listings, images, and descriptions you upload</li>
            <li><strong>Usage data:</strong> Pages visited, search queries, interaction patterns</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Purpose of Processing</h2>
          <p>We process personal data to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide access to the platform and display listings</li>
            <li>Process payments securely through our payment processor</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Communicate with you regarding support requests</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Legal Basis (GDPR)</h2>
          <p>
            Data is processed based on:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Contract performance:</strong> To provide our services</li>
            <li><strong>Legal obligations:</strong> Tax reporting, fraud prevention</li>
            <li><strong>Legitimate interests:</strong> Platform security, service improvement</li>
            <li><strong>Consent:</strong> For optional communications and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
          <p>We may share your data with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>Cloudflare:</strong> For security and content delivery</li>
            <li><strong>Supabase:</strong> For secure data storage and authentication</li>
            <li><strong>Law enforcement:</strong> When required by law</li>
          </ul>
          <p className="mt-4 font-medium">
            We do not sell or share your personal data with advertisers or third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Analytics</h2>
          <p>
            We use only functional and technical cookies necessary for the operation of the website. We do not use advertising or tracking cookies. For more information, see our <a href="/cookies" className="text-orange-600 hover:text-orange-700 underline">Cookies Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Storage & Security</h2>
          <p>
            Your data is stored in secure systems within the European Union. We implement reasonable technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Restriction:</strong> Limit processing of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at: <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
          <p>
            We retain personal data only as long as necessary for the purposes outlined in this policy or as required by law. Account data is deleted within 30 days of account closure, unless retention is required for legal compliance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact & Data Protection Officer</h2>
          <p>
            For privacy inquiries or to exercise your rights, contact our Data Protection Officer at: <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a>
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
