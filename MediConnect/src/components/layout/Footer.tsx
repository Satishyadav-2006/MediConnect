import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { Logo } from '@/components/ui'
import { cn } from '@/utils'

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'About', href: ROUTES.ABOUT },
      { label: 'Features', href: ROUTES.ABOUT },
      { label: 'Pricing', href: ROUTES.ABOUT },
      { label: 'FAQ', href: ROUTES.FAQ },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Help Center', href: ROUTES.FAQ },
      { label: 'API', href: '#' },
      { label: 'Community', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: ROUTES.PRIVACY_POLICY },
      { label: 'Terms of Service', href: ROUTES.TERMS },
      { label: 'Contact Us', href: ROUTES.CONTACT },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'LinkedIn', href: '#' },
      { label: 'Twitter', href: '#' },
      { label: 'GitHub', href: '#' },
    ],
  },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setIsSubscribed(true)
      setEmail('')
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <Logo size="sm" rounded />
              <span className="text-lg font-bold text-white">MediConnect</span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-xs">
              The professional networking platform for healthcare professionals. Connect, collaborate, and advance your career.
            </p>

            <div className="mt-6">
              <p className="text-sm font-medium text-white mb-2">Subscribe to our newsletter</p>
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 rounded-l-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className={cn(
                    'rounded-r-lg px-4 py-2 text-sm font-medium transition-colors',
                    isSubscribed
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  )}
                >
                  {isSubscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {footerColumns.map(col => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-screen-xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} MediConnect. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@mediconnect.com" className="text-gray-500 hover:text-white transition-colors">
              <FiMail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
