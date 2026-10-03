import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHeart, FiUsers, FiShield, FiGlobe } from 'react-icons/fi'
import { ROUTES } from '@/constants/routes'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import { Logo } from '@/components/ui'

const values = [
  { icon: <FiHeart size={24} />, title: 'Patient-Centered', desc: 'We believe in empowering healthcare professionals to deliver better patient outcomes through collaboration and knowledge sharing.' },
  { icon: <FiUsers size={24} />, title: 'Community First', desc: 'Building meaningful connections between healthcare professionals worldwide, fostering mentorship and professional growth.' },
  { icon: <FiShield size={24} />, title: 'Trust & Security', desc: 'Verified profiles and robust security measures ensure a safe and trustworthy platform for all members.' },
  { icon: <FiGlobe size={24} />, title: 'Global Impact', desc: 'Breaking geographical barriers to connect healthcare talent with opportunities across borders.' },
]

const team = [
  { name: 'Dr. Sarah Chen', role: 'CEO & Co-Founder', desc: 'Former cardiologist with 15 years of clinical experience.' },
  { name: 'Dr. James Wilson', role: 'CTO & Co-Founder', desc: 'Healthcare technology innovator and software engineer.' },
  { name: 'Maria Rodriguez', role: 'Head of Operations', desc: 'Healthcare administration and platform operations expert.' },
  { name: 'Dr. Aisha Patel', role: 'Head of Medical Affairs', desc: 'Specialist in medical credentialing and professional standards.' },
]

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <Logo size="sm" rounded />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">MediConnect</span>
        </Link>
        <Link to={ROUTES.HOME} className="text-sm font-medium text-primary-500 hover:text-primary-600">Back to Home</Link>
      </nav>

      <section className="px-6 py-20 text-center">
        <motion.div {...pageTransition}>
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] sm:text-5xl">About MediConnect</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-secondary)] leading-relaxed">
            We are on a mission to transform how healthcare professionals connect, collaborate, and advance their careers.
          </p>
        </motion.div>
      </section>

      <section className="px-6 py-16 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Our Mission</h2>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
              MediConnect was founded with a simple yet powerful vision: create a dedicated professional network where healthcare workers can connect, learn, and grow together. In an industry where collaboration saves lives, we believe that having the right connections and resources can make all the difference.
            </p>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
              From doctors and nurses to hospitals and clinics, MediConnect provides the tools and platform for healthcare professionals to build meaningful relationships, discover career opportunities, attend medical conferences, find mentors, and stay at the forefront of medical innovation.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-screen-xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-bold text-[var(--color-text-primary)]"
          >
            Our Values
          </motion.h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[var(--color-border-primary)] p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{v.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-[var(--color-bg-primary)]">
        <div className="mx-auto max-w-screen-xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-bold text-[var(--color-text-primary)]"
          >
            Meet Our Team
          </motion.h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{member.name}</h3>
                <p className="text-sm font-medium text-primary-500">{member.role}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Join MediConnect Today</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-text-secondary)]">
            Become part of a growing community of healthcare professionals making a difference.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to={ROUTES.REGISTER}><Button size="lg">Get Started Free</Button></Link>
            <Link to={ROUTES.LOGIN}><Button variant="outline" size="lg">Log In</Button></Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
