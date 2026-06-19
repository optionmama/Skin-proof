import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — SkinProof',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal-500 hover:text-charcoal-800 mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>

        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-skin-100 flex items-center justify-center">
                <Shield size={18} className="text-skin-600" />
              </div>
              <h1 className="font-display text-3xl text-charcoal-800">Privacy Policy</h1>
            </div>
            <p className="text-sm text-charcoal-500">Last updated: January 1, 2025</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-800 font-medium">Medical Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1">
              SkinProof is a personal tracking tool, not a medical device. The AI analysis provided is for
              informational purposes only and does not constitute medical advice, diagnosis, or treatment.
              Always consult a qualified dermatologist or healthcare provider for skin conditions.
            </p>
          </div>

          {[
            {
              title: '1. Information We Collect',
              content: `We collect information you provide directly to us, including:
• Account information: email address, display name, and password (hashed)
• Skin profile: skin type, concerns, known allergies, and Fitzpatrick scale type
• Daily check-in data: skin condition ratings, sleep hours, habits, and feelings
• Photos you upload for AI skin analysis
• Product diary entries: products used, ratings, reactions, and notes
• Usage data: how you interact with the app

We also collect technical data like device type, browser, IP address, and app usage patterns.`
            },
            {
              title: '2. How We Use Your Information',
              content: `We use your information to:
• Provide personalised skin tracking and progress analysis
• Generate AI-powered skin scan insights from photos you submit
• Recommend skincare products matched to your skin profile
• Maintain your product diary and track ingredient interactions
• Send optional reminder notifications for daily check-ins
• Improve our AI models and app features (using anonymised, aggregated data only)
• Comply with legal obligations

We do not sell your personal data to third parties. We do not use your data to target advertising.`
            },
            {
              title: '3. Photo Data & AI Analysis',
              content: `Photos you upload are stored securely in encrypted cloud storage. Photos are processed by our AI model to generate skin analysis metrics (scores for acne, redness, hydration, texture, and pigmentation).

Important: AI skin analysis is for personal tracking purposes only. Results are not medical diagnoses. Photo quality scores are provided to help you get more consistent tracking results — not to evaluate your appearance.

You may delete your photos and analysis data at any time from your profile settings.`
            },
            {
              title: '4. Product Recommendations & Affiliate Disclosure',
              content: `SkinProof may display links to purchase products from third-party retailers. Some of these links are affiliate links, meaning we may earn a commission if you make a purchase.

Important: Affiliate relationships never influence recommendation rankings. Products are ranked solely by their match to your skin profile, ingredient compatibility, and user outcomes data. Commission rates are never used in ranking algorithms.

Every affiliate link is clearly labelled with a disclosure. You can always see a product's full price comparison across retailers, including non-affiliate options.`
            },
            {
              title: '5. Data Storage & Security',
              content: `Your data is stored on servers provided by Supabase, Inc., which is SOC 2 Type II certified. Photos are stored in encrypted object storage. All data in transit uses TLS 1.3 encryption.

We retain your account data for as long as your account is active. If you delete your account, your personal data is permanently deleted within 30 days. Anonymised, aggregated analytics data may be retained indefinitely.`
            },
            {
              title: '6. Your Rights',
              content: `You have the right to:
• Access a copy of your personal data
• Correct inaccurate data
• Request deletion of your account and personal data
• Export your skin tracking data in a portable format
• Opt out of non-essential data processing

To exercise these rights, contact us at privacy@skinproof.app or use the Data & Privacy section in your profile settings.`
            },
            {
              title: '7. Third-Party Services',
              content: `We use the following third-party services:
• Supabase: database, authentication, and file storage
• Anthropic API (or similar): AI image analysis
• Vercel: application hosting and edge delivery

Each service has its own privacy policy. We only share the minimum data required for each service to function.`
            },
            {
              title: '8. Children\'s Privacy',
              content: `SkinProof is not intended for users under the age of 16. We do not knowingly collect personal data from children under 16. If you believe a child has created an account, please contact us immediately.`
            },
            {
              title: '9. Changes to This Policy',
              content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or in-app notification at least 14 days before the changes take effect. Continued use of SkinProof after the effective date constitutes acceptance of the updated policy.`
            },
            {
              title: '10. Contact Us',
              content: `For privacy questions, data requests, or concerns:\n\nEmail: privacy@skinproof.app\nPostal: SkinProof Privacy Team, [Address]`
            },
          ].map(({ title, content }) => (
            <div key={title} className="space-y-3">
              <h2 className="font-display text-xl text-charcoal-800">{title}</h2>
              <div className="text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">{content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
