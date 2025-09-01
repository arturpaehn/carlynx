import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund Policy for CarLynx.us - Understand our refund terms for listing fees, when refunds are available, and how to request them.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Refund Policy - CarLynx',
    description: 'Refund Policy for CarLynx.us marketplace. Learn about refund conditions and procedures.',
    url: 'https://carlynx.us/refunds',
  },
  alternates: {
    canonical: 'https://carlynx.us/refunds',
  },
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <div className="space-y-6">
        <p className="text-lg text-gray-800 font-medium">
          At CarLynx.us, operated by <strong>SYNTARIS DIGITAL OÜ</strong>, listing fees are generally non-refundable. However, we provide refunds in specific circumstances outlined below.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. When Refunds Are Available</h2>
          <p>Refunds may be issued in the following cases:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Technical Error:</strong> Your listing was not published due to a technical error on our platform</li>
            <li><strong>Service Not Delivered:</strong> Payment was processed but the listing service was not provided</li>
            <li><strong>Duplicate Payment:</strong> Multiple charges for the same listing due to system error</li>
            <li><strong>Platform Downtime:</strong> Extended service interruption preventing listing visibility</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. When Refunds Are Not Available</h2>
          <p>Refunds will not be provided in the following cases:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>You decide not to sell your vehicle after payment</li>
            <li>You voluntarily change or remove your listing</li>
            <li>Your listing receives insufficient inquiries or views</li>
            <li>Market conditions change affecting vehicle value</li>
            <li>Buyer financing falls through or changes their mind</li>
            <li>You found a buyer through other channels</li>
            <li>Listing expires after the paid period</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Refund Process</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Submit Request</h3>
              <p>
                Refund requests must be submitted to <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a> within <strong>14 days</strong> of the original payment date.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Required Information</h3>
              <p>Include the following in your refund request:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Transaction ID or payment confirmation</li>
                <li>Listing ID (if applicable)</li>
                <li>Detailed explanation of the issue</li>
                <li>Supporting evidence (screenshots, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Review Process</h3>
              <p>
                Valid requests will be reviewed and processed within <strong>7-10 business days</strong>. We may request additional information to verify your request.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Refund Processing</h3>
              <p>
                Approved refunds are returned to the original payment method via Stripe. Processing time depends on your bank or payment provider (typically 3-5 business days).
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Chargeback Policy</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800">
              <strong>Important:</strong> Before initiating a chargeback with your bank, please contact us first at <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a>. Chargebacks for services that were properly delivered may result in account suspension and additional fees.
            </p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargeback Prevention</h3>
            <p>We work with you to resolve disputes fairly:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Quick response to legitimate concerns</li>
              <li>Clear documentation of services provided</li>
              <li>Fair resolution attempts before escalation</li>
              <li>Transparent communication throughout the process</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partial Refunds</h2>
          <p>
            In certain circumstances, we may offer partial refunds based on:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>How long your listing was active before the issue occurred</li>
            <li>The extent of service interruption</li>
            <li>Impact on listing visibility or functionality</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact for Refunds</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Email:</strong> <a href="mailto:support@carlynx.us" className="text-orange-600 hover:text-orange-700 underline">support@carlynx.us</a><br />
              <strong>Subject Line:</strong> &ldquo;Refund Request - [Your Transaction ID]&rdquo;<br />
              <strong>Response Time:</strong> Within 24-48 hours during business days
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated effective date. We recommend reviewing this policy periodically.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
