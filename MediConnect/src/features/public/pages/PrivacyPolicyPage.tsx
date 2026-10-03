import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/constants/routes'
import { pageTransition } from '@/animations'
import { Logo } from '@/components/ui'

const sections = [
  {
    title: 'Information We Collect',
    content: `When you use MediConnect, we collect information you provide directly, such as your name, email address, professional credentials, and profile information. We also collect usage data including log information, device identifiers, and cookies to improve our services. For healthcare professionals, we may collect and verify professional license information as part of our verification process.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use your information to provide, maintain, and improve our platform services. This includes connecting you with other healthcare professionals, personalizing your experience, sending relevant notifications, verifying professional credentials, ensuring platform security, and communicating about updates, events, and opportunities relevant to your healthcare career.`,
  },
  {
    title: 'Information Sharing',
    content: `We do not sell your personal information. We may share your information with your consent, with service providers who assist in platform operations, when required by law, or to protect the rights and safety of MediConnect and its users. Your public profile information is visible to other platform members based on your privacy settings.`,
  },
  {
    title: 'Data Security',
    content: `We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your personal information. While we strive to protect your data, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: 'Cookies & Tracking',
    content: `We use cookies and similar technologies to maintain session state, remember preferences, analyze platform usage, and improve user experience. You can control cookie settings through your browser preferences. Essential cookies required for platform functionality cannot be disabled.`,
  },
  {
    title: 'Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within 30 days, except where we need to retain certain information for legal, regulatory, or legitimate business purposes.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to access, correct, or delete your personal information. You can manage most account settings directly through your profile. For additional requests regarding your data, please contact our privacy team at privacy@mediconnect.com. We will respond to data requests within 30 days.`,
  },
  {
    title: 'Contact Us',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us at privacy@mediconnect.com or write to us at MediConnect Privacy Team, 123 Healthcare Drive, Suite 456, Medical City, MC 78901.`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <Logo size="sm" rounded />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">MediConnect</span>
        </Link>
        <Link to={ROUTES.HOME} className="text-sm font-medium text-primary-500 hover:text-primary-600">Back to Home</Link>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Last updated: January 1, 2026</p>
          <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
            At MediConnect, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, share, and protect your information when you use our platform.
          </p>
        </motion.div>

        <div className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
              <p className="mt-3 text-[var(--color-text-secondary)] leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
