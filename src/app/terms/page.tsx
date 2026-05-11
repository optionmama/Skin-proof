import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — SkinProof',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">
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
                <FileText size={18} className="text-skin-600" />
              </div>
              <h1 className="font-display text-3xl text-charcoal-800">Terms of Service</h1>
            </div>
            <p className="text-sm text-charcoal-500">Last updated: January 1, 2025</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-800 font-medium">Important Medical Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1">
              SkinProof is a personal skin tracking application, NOT a medical device or service.
              Nothing in the app — including AI analysis results, skin scores, or product recommendations —
              constitutes medical advice, diagnosis, or treatment. Always seek the advice of a qualified
              dermatologist or physician for any skin condition.
            </p>
          </div>

          {[
            {
              title: '1. Acceptance of Terms',
              content: 'By creating an account or using SkinProof ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.'
            },
            {
              title: '2. Eligibility',
              content: 'You must be at least 16 years old to use SkinProof. By using the Service, you represent that you meet this age requirement. If you are between 16 and 18, you represent that a parent or guardian has reviewed and agreed to these terms on your behalf.'
            },
            {
              title: '3. Not Medical Advice',
              content: `The Service provides personal skin tracking tools including:
• AI-powered photo analysis that generates numerical skin metrics
• Progress tracking charts and trend analysis
• Product ingredient compatibility assessments
• Personalised product recommendations based on your skin profile

None of these features constitute medical advice, and none should be used to diagnose, treat, cure, or prevent any skin condition or disease. SkinProof is not a substitute for professional medical care. If you have a skin condition, rash, unusual lesion, or any medical concern, consult a qualified dermatologist immediately.`
            },
            {
              title: '4. User Account',
              content: `You are responsible for:
• Maintaining the security of your account credentials
• All activity that occurs under your account
• Providing accurate information in your skin profile
• Notifying us immediately of any unauthorised access

You may not share your account with others or create multiple accounts.`
            },
            {
              title: '5. User Content & Photos',
              content: `By uploading photos or other content to SkinProof, you grant us a limited, non-exclusive, royalty-free licence to store, process, and display your content solely for the purpose of providing the Service to you.

You retain full ownership of your photos and data. We do not sell, license, or share your photos with third parties. AI analysis is performed on your photos to generate skin metrics that are stored in your account.

You are responsible for ensuring that photos you upload comply with applicable laws and do not infringe the rights of others.`
            },
            {
              title: '6. Prohibited Uses',
              content: `You may not:
• Use the Service for any unlawful purpose
• Attempt to reverse-engineer or access the Service's underlying AI models
• Upload content that is illegal, harmful, or infringes third-party rights
• Attempt to circumvent security measures or access other users' data
• Use automated tools to scrape or extract data from the Service
• Misrepresent your identity or affiliation`
            },
            {
              title: '7. Product Recommendations & Affiliate Links',
              content: `SkinProof provides product recommendations based solely on your skin profile and ingredient compatibility. We may earn affiliate commissions from purchases made through retailer links.

We explicitly warrant that affiliate commission rates do not influence recommendation rankings or ordering. The ranking algorithm uses only skin match scores, ingredient safety data, and user outcome data.

Affiliate links are always clearly disclosed. You are under no obligation to purchase through our links.`
            },
            {
              title: '8. Disclaimer of Warranties',
              content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that AI analysis results are accurate, complete, or suitable for any particular purpose. Skin analysis scores are estimates based on photo quality and AI model capability, which may vary.`
            },
            {
              title: '9. Limitation of Liability',
              content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKINPROOF AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING RELIANCE ON AI SKIN ANALYSIS RESULTS.

Our total liability to you for any claims arising from use of the Service shall not exceed the amount you paid for the Service in the twelve months preceding the claim.`
            },
            {
              title: '10. Termination',
              content: 'We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time from your profile settings. Upon termination, your personal data will be deleted in accordance with our Privacy Policy.'
            },
            {
              title: '11. Changes to Terms',
              content: 'We may modify these Terms at any time. We will provide at least 14 days notice of material changes via email or in-app notification. Continued use of the Service after the effective date constitutes acceptance of the updated Terms.'
            },
            {
              title: '12. Governing Law',
              content: 'These Terms are governed by the laws of [Jurisdiction]. Any disputes shall be resolved in the courts of [Jurisdiction].'
            },
            {
              title: '13. Contact',
              content: 'For questions about these Terms:\n\nEmail: legal@skinproof.app'
            },
          ].map(({ title, content }) => (
            <div key={title} className="space-y-3">
              <h2 className="font-display text-xl text-charcoal-800">{title}</h2>
              <p className="text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
