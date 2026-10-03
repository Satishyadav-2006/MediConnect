import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiMail, FiPhone, FiMapPin, FiLinkedin, FiTwitter, FiGithub } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Logo } from '@/components/ui'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

type ContactFormData = z.infer<typeof contactSchema>

const contactInfo = [
  { icon: <FiMail size={20} />, label: 'Email', value: 'support@mediconnect.com', href: 'mailto:support@mediconnect.com' },
  { icon: <FiPhone size={20} />, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: <FiMapPin size={20} />, label: 'Address', value: '123 Healthcare Drive, Suite 456, Medical City, MC 78901', href: null },
]

const socialLinks = [
  { icon: <FiLinkedin size={20} />, label: 'LinkedIn', href: '#' },
  { icon: <FiTwitter size={20} />, label: 'Twitter', href: '#' },
  { icon: <FiGithub size={20} />, label: 'GitHub', href: '#' },
]

export default function ContactUsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (_data: ContactFormData) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Your message has been sent! We\'ll get back to you within 24 hours.')
    reset()
    setIsLoading(false)
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

      <div className="mx-auto max-w-5xl px-6 py-12">
        <motion.div {...pageTransition}>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Contact Us</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Have a question or need assistance? We are here to help.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Send us a message</h2>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
                  <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
                </div>
                <Input label="Subject" placeholder="How can we help?" error={errors.subject?.message} {...register('subject')} />
                <Textarea label="Message" placeholder="Tell us more about your question or issue..." rows={6} error={errors.message?.message} {...register('message')} />
                <Button type="submit" isLoading={isLoading}>Send Message</Button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-6">
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Contact Information</h3>
              <div className="mt-4 space-y-4">
                {contactInfo.map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-[var(--color-text-secondary)] hover:text-primary-500">{item.value}</a>
                      ) : (
                        <p className="text-sm text-[var(--color-text-secondary)]">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Follow Us</h3>
              <div className="mt-4 flex gap-3">
                {socialLinks.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-primary-50 hover:text-primary-500 hover:border-primary-300 transition-colors"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Office Hours</h3>
              <div className="mt-3 space-y-1">
                <p className="text-sm text-[var(--color-text-secondary)]">Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Saturday: 10:00 AM - 2:00 PM</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Sunday: Closed</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
