import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  FiUsers,
  FiBriefcase,
  FiAward,
  FiCalendar,
  FiBookOpen,
  FiSearch,
  FiChevronDown,
  FiStar,
  FiArrowRight,
  FiUserPlus,
  FiMessageCircle,
  FiTrendingUp,
} from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import Button from '@/components/ui/Button'
import { Logo } from '@/components/ui'
import Footer from '@/components/layout/Footer'

const features = [
  { icon: FiUsers, title: 'Professional Networking', description: 'Build meaningful connections with doctors, nurses, specialists, and healthcare administrators across the globe. Expand your professional circle and discover collaborative opportunities.' },
  { icon: FiBriefcase, title: 'Career Opportunities', description: 'Access exclusive job listings and internships from leading hospitals, clinics, and healthcare organizations. Find positions that match your specialty and career aspirations.' },
  { icon: FiAward, title: 'Mentorship Programs', description: 'Connect with experienced healthcare leaders who can guide your professional development. Gain insights from those who have navigated the complexities of medical careers.' },
  { icon: FiCalendar, title: 'Medical Events', description: 'Discover and attend medical conferences, workshops, seminars, and networking events. Stay current with the latest developments and earn continuing education credits.' },
  { icon: FiBookOpen, title: 'Knowledge Sharing', description: 'Share research, clinical insights, and best practices with your peers. Publish articles, participate in discussions, and contribute to the advancement of healthcare knowledge.' },
  { icon: FiSearch, title: 'Recruitment Hub', description: 'Healthcare organizations can post jobs, scout top talent, and build their teams. Job seekers can showcase their credentials and connect directly with hiring managers.' },
]

const stats = [
  { value: 50000, suffix: '+', label: 'Healthcare Professionals' },
  { value: 5000, suffix: '+', label: 'Organizations' },
  { value: 10000, suffix: '+', label: 'Job Opportunities' },
  { value: 1000, suffix: '+', label: 'Events Hosted' },
]

const steps = [
  { icon: FiUserPlus, title: 'Create Your Profile', description: 'Build a comprehensive professional profile showcasing your medical credentials, experience, specializations, and career achievements. Verified credentials build trust within the community.' },
  { icon: FiMessageCircle, title: 'Connect & Engage', description: 'Join specialized groups, participate in medical discussions, attend virtual events, and build relationships with healthcare professionals who share your interests and goals.' },
  { icon: FiTrendingUp, title: 'Advance Your Career', description: 'Discover new opportunities, find mentors, expand your knowledge, and take the next step in your healthcare career with the support of a thriving professional community.' },
]

const testimonials = [
  { quote: 'MediConnect transformed how I network in the medical field. I found my current position through a connection I made here, and the mentorship program has been invaluable for my growth as a cardiologist.', name: 'Dr. Sarah Chen', title: 'Cardiologist', organization: 'Stanford Medical Center', rating: 5 },
  { quote: 'As a nurse looking to transition into healthcare administration, MediConnect connected me with mentors who guided me through the process. The platform is a game-changer for healthcare career development.', name: 'James Rodriguez, RN', title: 'Nurse Manager', organization: 'Johns Hopkins Hospital', rating: 5 },
  { quote: 'Our hospital uses MediConnect to recruit top talent and post medical events. The quality of candidates and the engagement at our events have exceeded every expectation. Highly recommended.', name: 'Dr. Amara Okafor', title: 'Chief Medical Officer', organization: 'Mayo Clinic', rating: 5 },
]

const faqs = [
  { question: 'Who can join MediConnect?', answer: 'MediConnect is designed for all healthcare professionals including doctors, nurses, pharmacists, therapists, technicians, medical students, and healthcare administrators. Healthcare organizations such as hospitals, clinics, and research institutions can also create verified profiles.' },
  { question: 'Is MediConnect free to use?', answer: 'Yes, creating a profile and accessing core features like networking, job browsing, and event discovery is completely free. We also offer premium plans with advanced features such as priority job listings, enhanced analytics, and premium mentorship matching.' },
  { question: 'How does credential verification work?', answer: 'When you sign up, you can submit your medical license, board certifications, and institutional affiliations for verification. Our verification team cross-references these with official databases. Verified profiles display a trust badge that increases visibility and credibility.' },
  { question: 'Can organizations recruit through MediConnect?', answer: 'Absolutely. Healthcare organizations can create verified company profiles, post job openings and internship opportunities, host events, and directly connect with qualified candidates. Our recruitment tools are designed specifically for the healthcare industry.' },
  { question: 'How does the mentorship program work?', answer: 'Experienced healthcare professionals can sign up as mentors, specifying their areas of expertise and availability. Mentees can browse mentor profiles, request mentorship, and schedule sessions. The platform facilitates communication and tracking of mentorship goals.' },
  { question: 'What types of events can I find on MediConnect?', answer: 'You can find medical conferences, continuing education workshops, networking meetups, grand rounds, research presentations, career fairs, and virtual webinars. Organizations can also host private events for their members and employees.' },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-lg font-medium text-gray-900 pr-4">{question}</span>
        <FiChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-600 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-xl font-bold text-gray-900">MediConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.LOGIN} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
          <Link to={ROUTES.REGISTER}><Button size="sm">Join Now</Button></Link>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-6 py-24 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-screen-xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                The Professional Network for{' '}
                <span className="text-primary-200">Healthcare</span>
              </h1>
              <p className="mt-6 text-lg text-primary-100 max-w-xl leading-relaxed">
                Connect with fellow healthcare professionals, discover career opportunities,
                find mentors, and advance your medical career — all in one powerful platform
                built exclusively for the healthcare community.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3 shadow-lg">
                    Join Now
                  </Button>
                </Link>
                <Link to={ROUTES.ABOUT}>
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/20 font-semibold px-8 py-3">
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative mx-auto w-full max-w-md">
                <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/15 p-4 text-center">
                      <FiUsers className="mx-auto h-8 w-8 text-white" />
                      <p className="mt-2 text-sm font-medium text-white">Network</p>
                    </div>
                    <div className="rounded-xl bg-white/15 p-4 text-center">
                      <FiBriefcase className="mx-auto h-8 w-8 text-white" />
                      <p className="mt-2 text-sm font-medium text-white">Careers</p>
                    </div>
                    <div className="rounded-xl bg-white/15 p-4 text-center">
                      <FiAward className="mx-auto h-8 w-8 text-white" />
                      <p className="mt-2 text-sm font-medium text-white">Mentorship</p>
                    </div>
                    <div className="rounded-xl bg-white/15 p-4 text-center">
                      <FiCalendar className="mx-auto h-8 w-8 text-white" />
                      <p className="mt-2 text-sm font-medium text-white">Events</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-screen-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why MediConnect?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to grow your healthcare career and make meaningful professional connections.
            </p>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <feature.icon size={28} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 px-6 py-20">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-white sm:text-5xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-sm text-gray-400 sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-screen-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps and unlock the full potential of your healthcare career.
            </p>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="text-center"
              >
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <step.icon size={32} />
                  <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-screen-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What Healthcare Professionals Say</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their careers with MediConnect.
            </p>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="rounded-2xl border border-gray-200 bg-white p-8"
              >
                <div className="flex gap-1 text-yellow-400">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <FiStar key={j} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.organization}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-screen-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about MediConnect.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12"
          >
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
          <div className="mt-8 text-center">
            <Link
              to={ROUTES.FAQ}
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              View all FAQs <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="mx-auto max-w-screen-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Transform Your Healthcare Career?
            </h2>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Join thousands of healthcare professionals who are already building connections,
              discovering opportunities, and advancing their careers on MediConnect.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold">
                  Get Started
                </Button>
              </Link>
              <Link to={ROUTES.ABOUT}>
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
