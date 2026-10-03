import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { pageTransition } from '@/animations'
import { Logo } from '@/components/ui'
import { cn } from '@/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  name: string
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    name: 'General',
    items: [
      { question: 'What is MediConnect?', answer: 'MediConnect is a professional networking platform built exclusively for healthcare professionals. It connects doctors, nurses, dentists, pharmacists, hospitals, and clinics, providing tools for networking, career development, events, mentorship, and knowledge sharing.' },
      { question: 'Is MediConnect free to use?', answer: 'Yes, MediConnect offers a free tier with core networking features. Premium plans are available for organizations and professionals who need advanced features like analytics, priority support, and enhanced recruitment tools.' },
      { question: 'Who can join MediConnect?', answer: 'MediConnect is open to all healthcare professionals including doctors, nurses, dentists, pharmacists, and healthcare organizations such as hospitals and clinics. All professional profiles undergo verification to ensure a trusted community.' },
    ],
  },
  {
    name: 'Account',
    items: [
      { question: 'How do I create an account?', answer: 'Click the "Join now" button on the homepage, select your role, fill in your personal and professional information, and submit your registration. You will then need to verify your email and complete the professional verification process.' },
      { question: 'How does professional verification work?', answer: 'After registering, submit your professional license and credentials for review. Our verification team typically processes applications within 1-3 business days. Once approved, your profile will display a verified badge.' },
      { question: 'I forgot my password. What should I do?', answer: 'Click "Forgot password?" on the login page and enter your registered email address. You will receive a password reset link valid for 24 hours. If you do not receive the email, check your spam folder or contact support.' },
      { question: 'Can I change my username?', answer: 'Yes, you can change your username once every 30 days from your account settings. The new username must be unique and comply with our naming guidelines (letters, numbers, and underscores only).' },
    ],
  },
  {
    name: 'Jobs',
    items: [
      { question: 'How do I apply for jobs?', answer: 'Browse the Jobs section, use filters to find relevant positions, and click "Apply" on the job listing. You can attach your resume and cover letter. Employers will review your application and contact you for next steps.' },
      { question: 'Can I post job listings?', answer: 'Yes, verified organizations (hospitals and clinics) can post job listings. Navigate to the Jobs section and click "Post a Job." Fill in the job details including title, description, requirements, and salary range.' },
      { question: 'Are job listings verified?', answer: 'Job listings from verified organizations are marked with a verified badge. We review all job postings to ensure they meet our quality standards and are legitimate opportunities in the healthcare sector.' },
    ],
  },
  {
    name: 'Events',
    items: [
      { question: 'How do I find medical events?', answer: 'Visit the Events section to browse upcoming medical conferences, workshops, webinars, and networking events. Use filters to narrow down by type, location, or specialty. You can register directly through the platform.' },
      { question: 'Can I host events on MediConnect?', answer: 'Yes, verified professionals and organizations can create events. Go to Events > Create Event, and fill in the details including title, description, date, location, and capacity. You can offer online, in-person, or hybrid formats.' },
      { question: 'Do events offer certificates?', answer: 'Many events on MediConnect offer certificates of attendance or CME credits. Look for the certificate badge on event listings. Requirements for earning certificates vary by event and are specified by the organizer.' },
    ],
  },
  {
    name: 'Mentorship',
    items: [
      { question: 'How does the mentorship program work?', answer: 'Experienced healthcare professionals can sign up as mentors, specifying their availability and areas of expertise. Mentees can browse mentor profiles and send mentorship requests. Once accepted, both parties can communicate through the platform.' },
      { question: 'Can I become a mentor?', answer: 'Yes, if you have significant experience in healthcare, you can apply to become a mentor from the Mentorship section. Complete your mentor profile with your specializations, experience, and availability. Applications are reviewed for quality assurance.' },
      { question: 'Is there a cost for mentorship?', answer: 'The mentorship program is free for all verified MediConnect members. We believe in fostering professional growth within the healthcare community without financial barriers.' },
    ],
  },
  {
    name: 'Privacy',
    items: [
      { question: 'Is my data safe on MediConnect?', answer: 'Yes, we take data security seriously. We use industry-standard encryption, secure servers, and strict access controls. Our platform is compliant with relevant data protection regulations. Read our Privacy Policy for full details.' },
      { question: 'Who can see my profile?', answer: 'You control your profile visibility through your privacy settings. By default, your profile is visible to other MediConnect members. You can restrict visibility to connections only or make it private. Contact information visibility is also configurable.' },
      { question: 'Can I delete my account?', answer: 'Yes, you can delete your account from your account settings. Account deletion is permanent and cannot be undone. Your data will be removed within 30 days, except where retention is required by law.' },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[var(--color-border-primary)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className={cn('text-sm font-medium pr-4', isOpen ? 'text-primary-500' : 'text-[var(--color-text-primary)]')}>
          {item.question}
        </span>
        {isOpen ? (
          <FiChevronUp size={18} className="shrink-0 text-primary-500" />
        ) : (
          <FiChevronDown size={18} className="shrink-0 text-[var(--color-text-muted)]" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('General')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const filteredData = useMemo(() => {
    if (!search.trim()) return faqData
    const q = search.toLowerCase()
    return faqData.map(cat => ({
      ...cat,
      items: cat.items.filter(
        item => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.items.length > 0)
  }, [search])

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
        <motion.div {...pageTransition}>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Frequently Asked Questions</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Find answers to common questions about MediConnect.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 relative"
        >
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] py-3 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {faqData.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === cat.name
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-primary)]'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
          {filteredData.map(cat => (
            <div key={cat.name} className={cat.name === activeCategory || search.trim() ? 'block' : 'hidden'}>
              {search.trim() && (
                <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">{cat.name}</h3>
              )}
              {cat.items.map(item => {
                const key = `${cat.name}-${item.question}`
                return (
                  <AccordionItem
                    key={key}
                    item={item}
                    isOpen={!!openItems[key]}
                    onToggle={() => toggleItem(key)}
                  />
                )
              })}
            </div>
          ))}
          {filteredData.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              No questions found matching your search. Try different keywords.
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center shadow-sm"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Still have questions?</h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Can not find the answer you are looking for? Reach out to our support team.
          </p>
          <Link to={ROUTES.CONTACT} className="mt-4 inline-block">
            <button className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
              Contact Support
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
