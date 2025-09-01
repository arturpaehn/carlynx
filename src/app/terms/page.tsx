import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for CarLynx.us - Your trusted marketplace for buying and selling used cars and motorcycles. Learn about our platform rules, user responsibilities, and service conditions.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Service - CarLynx',
    description: 'Terms of Service for CarLynx.us marketplace. Understanding your rights and responsibilities when using our platform.',
    url: 'https://carlynx.us/terms',
  },
  alternates: {
    canonical: 'https://carlynx.us/terms',
  },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <div className="space-y-6">
        <p className="text-lg text-gray-800 font-medium">
          Welcome to CarLynx.us, an online platform operated by <strong>SYNTARIS DIGITAL OÜ</strong>, located in Ida-Viru maakond, Narva, Estonia (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By accessing or using our website, you agree to the following Terms of Service. If you do not agree, please do not use the platform.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Services</h2>
          <p>
            CarLynx.us allows users to post and browse vehicle listings for cars and motorcycles. The platform provides advertising space only. We are not a party to any transaction between buyers and sellers and do not provide warranties or guarantees regarding vehicles, sellers, or transactions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
          <p>
            Users must provide accurate information during registration and are responsible for maintaining the security of their accounts. You must be at least 18 years old to create an account. Any misuse, fraudulent activity, or violation of these Terms may result in immediate account suspension or termination.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Conditions</h2>
          <p>
            Posting vehicle listings requires a fee, processed securely through Stripe. All fees are clearly stated before payment and are non-refundable except as outlined in our Refund Policy. We reserve the right to modify pricing with 30 days notice to existing users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
          <p>
            You are solely responsible for the accuracy of your listings and for complying with applicable laws. You grant CarLynx a non-exclusive license to display your content on our platform. Prohibited content includes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Fraudulent, misleading, or false information</li>
            <li>Illegal items or stolen vehicles</li>
            <li>Discriminatory or harmful content</li>
            <li>Content that violates intellectual property rights</li>
            <li>Spam or irrelevant material</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Activities</h2>
          <p>
            Users are prohibited from engaging in activities that may harm the platform or other users, including but not limited to automated data scraping, attempts to circumvent security measures, or harassment of other users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Disclaimer of Warranties</h2>
          <p>
            We provide the platform &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee the accuracy of listings, the success of transactions, or the availability of the service at all times.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, SYNTARIS DIGITAL OÜ shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the platform, including but not limited to lost profits, business interruption, or data loss.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Estonia and applicable European Union law. Any disputes shall be resolved in the competent courts of Estonia. If you are a consumer resident in the EU, you may also have the right to bring proceedings in your country of residence.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use of the platform after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
          <p>
            For questions about these Terms, please contact us at: <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a>
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
