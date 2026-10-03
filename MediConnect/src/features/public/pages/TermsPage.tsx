import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/constants/routes'
import { pageTransition } from '@/animations'
import { Logo } from '@/components/ui'

const sections = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using MediConnect, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our platform. We reserve the right to modify these terms at any time, and continued use of the platform constitutes acceptance of any changes.`,
  },
  {
    title: 'User Accounts',
    content: `You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration and keep your profile updated. One person may not maintain more than one account.`,
  },
  {
    title: 'Acceptable Use',
    content: `You agree to use MediConnect only for lawful purposes and in accordance with these terms. You must not post content that is defamatory, discriminatory, misleading, or violates any applicable laws. You must not attempt to access other users' accounts, distribute spam, use automated systems to access the platform, or engage in any activity that could harm the platform or its users.`,
  },
  {
    title: 'Content',
    content: `You retain ownership of content you post on MediConnect. By posting content, you grant us a non-exclusive, worldwide license to use, modify, and display your content in connection with platform services. You are solely responsible for the content you share and must have the necessary rights to post it. We reserve the right to remove content that violates these terms.`,
  },
  {
    title: 'Intellectual Property',
    content: `All platform content, features, and functionality — including but not limited to text, graphics, logos, icons, images, audio, video, software, and code — are owned by MediConnect or its licensors and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: 'Termination',
    content: `We may suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. Upon termination, your right to use the platform ceases immediately. We may retain certain data as required by law or for legitimate business purposes. You may also delete your account at any time through your account settings.`,
  },
  {
    title: 'Limitation of Liability',
    content: `MediConnect is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater. We do not guarantee uninterrupted or error-free service.`,
  },
  {
    title: 'Governing Law',
    content: `These Terms and Conditions are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law principles. Any disputes arising under these terms shall be resolved through binding arbitration in accordance with the American Arbitration Association.`,
  },
  {
    title: 'Contact',
    content: `For questions about these Terms and Conditions, please contact us at legal@mediconnect.com or write to MediConnect Legal Team, 123 Healthcare Drive, Suite 456, Medical City, MC 78901.`,
  },
]

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Last updated: January 1, 2026</p>
          <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
            Welcome to MediConnect. These Terms and Conditions govern your use of our platform and services. Please read them carefully before using MediConnect.
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
