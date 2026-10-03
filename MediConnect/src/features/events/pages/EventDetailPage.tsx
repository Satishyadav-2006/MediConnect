import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiClock, FiGlobe, FiVideo, FiLink, FiMaximize, FiAward, FiShare2, FiCheckCircle, FiX, FiMap, FiExternalLink } from 'react-icons/fi'
import { useEvent, useRegisterEvent } from '@/features/events/hooks/useEvents'
import { pageTransition } from '@/animations'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { cn, formatFullDate, formatDateTime } from '@/utils'
import type { Event, Speaker, AgendaItem } from '@/types'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useEvent(id || '')
  const registerEvent = useRegisterEvent()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  const event = (data?.data?.event || data?.data || data) as Event | undefined

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </motion.div>
    )
  }

  if (isError || !event) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Event not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </motion.div>
    )
  }

  const statusColors = { upcoming: 'info' as const, live: 'danger' as const, completed: 'success' as const, cancelled: 'default' as const }
  const modeIcons = { online: <FiVideo size={14} />, in_person: <FiMapPin size={14} />, hybrid: <FiGlobe size={14} /> }
  const seatsLeft = event.maxAttendees ? event.maxAttendees - event.attendeesCount : null

  const handleRegister = () => {
    registerEvent.mutate({ id: event._id }, {
      onSuccess: () => {
        setShowConfirmModal(false)
        setShowQRCode(true)
      }
    })
  }

  const handleCancelRegistration = () => {
    registerEvent.mutate({ id: event._id, unregister: true }, {
      onSuccess: () => {
        setShowCancelModal(false)
      }
    })
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <FiArrowLeft size={16} /> Back to events
      </button>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border-primary)]">
        <div className="h-48 sm:h-64 bg-gradient-to-br from-primary-500 to-primary-700 relative">
          {event.banner && <img src={event.banner} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusColors[event.status]} dot>{event.status}</Badge>
              <Badge variant="default">{event.mode.replace('_', ' ')}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          </div>
        </div>

        <div className="p-6 bg-[var(--color-bg-primary)]">
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
            <span className="flex items-center gap-1.5"><FiCalendar size={14} />{formatFullDate(event.startDate)} – {formatFullDate(event.endDate)}</span>
            <span className="flex items-center gap-1.5">{modeIcons[event.mode]}{event.mode === 'online' ? 'Online' : event.location || 'TBA'}</span>
            <span className="flex items-center gap-1.5"><FiUsers size={14} />{event.attendeesCount} attendees</span>
            {event.maxAttendees && <span className="text-[var(--color-text-muted)]">/ {event.maxAttendees} max</span>}
            {seatsLeft !== null && seatsLeft > 0 && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                seatsLeft <= 10 ? 'bg-danger-50 text-danger-600' : 'bg-accent-50 text-accent-600'
              )}>
                {seatsLeft} seats left
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {event.isRegistered ? (
              <>
                <Button variant="outline" onClick={() => setShowCancelModal(true)} isLoading={registerEvent.isPending}>
                  Cancel Registration
                </Button>
                {event.onlineLink && event.status === 'live' && (
                  <a href={event.onlineLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="success" leftIcon={<FiLink size={14} />}>Join Event</Button>
                  </a>
                )}
              </>
            ) : (
              <Button onClick={() => setShowConfirmModal(true)} isLoading={registerEvent.isPending}>Register</Button>
            )}
            <Button variant="outline" leftIcon={<FiShare2 size={14} />} onClick={() => setShowShareModal(true)}>Share</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">About this event</h2>
            <div className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{event.description}</div>
          </div>

          {event.agenda?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Agenda / Schedule</h2>
              <div className="mt-3 space-y-3">
                {event.agenda.map((item: AgendaItem) => (
                  <div key={item._id} className="flex gap-3 border-b border-[var(--color-border-primary)] pb-3 last:border-0 last:pb-0">
                    <div className="shrink-0 text-xs text-[var(--color-text-muted)] w-24">
                      <p className="font-medium">{formatDateTime(item.startTime).split(' at ')[1] || item.startTime}</p>
                      <p className="text-[10px]">to {formatDateTime(item.endTime).split(' at ')[1] || item.endTime}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</p>
                      {item.description && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.description}</p>}
                      {item.speaker && <p className="text-xs text-primary-500 mt-0.5">Speaker: {item.speaker}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.mode === 'in_person' && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <FiMap size={16} /> Venue Details
              </h2>
              <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{event.location || 'Venue TBA'}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Address details will be shared upon registration</p>
                <div className="mt-3 h-32 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                  <div className="text-center">
                    <FiMap size={24} className="mx-auto text-[var(--color-text-muted)] mb-1" />
                    <p className="text-xs text-[var(--color-text-muted)]">Map preview</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(event.mode === 'online' || event.mode === 'hybrid') && event.onlineLink && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <FiVideo size={16} /> Meeting Links
              </h2>
              <div className="space-y-2">
                {event.onlineLink.includes('meet.google') && (
                  <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FiVideo size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Google Meet</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{event.onlineLink}</p>
                    </div>
                    <FiExternalLink size={14} className="text-[var(--color-text-muted)]" />
                  </a>
                )}
                {event.onlineLink.includes('zoom') && (
                  <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FiVideo size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Zoom</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{event.onlineLink}</p>
                    </div>
                    <FiExternalLink size={14} className="text-[var(--color-text-muted)]" />
                  </a>
                )}
                {event.onlineLink.includes('teams') && (
                  <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <FiVideo size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Microsoft Teams</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{event.onlineLink}</p>
                    </div>
                    <FiExternalLink size={14} className="text-[var(--color-text-muted)]" />
                  </a>
                )}
                {!event.onlineLink.includes('meet.google') && !event.onlineLink.includes('zoom') && !event.onlineLink.includes('teams') && (
                  <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <FiLink size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Meeting Link</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{event.onlineLink}</p>
                    </div>
                    <FiExternalLink size={14} className="text-[var(--color-text-muted)]" />
                  </a>
                )}
              </div>
              {event.status !== 'live' && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">Link will be active when the event starts</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {event.speakers?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Speakers</h3>
              <div className="space-y-4">
                {event.speakers.map((speaker: Speaker) => (
                  <div key={speaker._id} className="flex items-start gap-3">
                    <Avatar src={speaker.photo} name={speaker.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{speaker.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{speaker.title}</p>
                      {speaker.organization && <p className="text-xs text-[var(--color-text-muted)]">{speaker.organization}</p>}
                      {speaker.bio && <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{speaker.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.tags?.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map(tag => <Badge key={tag} variant="default" size="sm">{tag}</Badge>)}
              </div>
            </div>
          )}

          {event.certificateInfo?.enabled && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                <FiAward size={14} /> Certificate
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Attendees will receive a certificate of participation.</p>
              {event.certificateInfo.requirements && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">Requirements:</p>
                  <ul className="space-y-1">
                    {(Array.isArray(event.certificateInfo.requirements) ? event.certificateInfo.requirements : [event.certificateInfo.requirements]).map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {seatsLeft !== null && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Seats</h3>
              <div className="relative h-3 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                <div
                  className={cn('absolute left-0 top-0 h-full rounded-full transition-all', seatsLeft <= 10 ? 'bg-danger-500' : 'bg-primary-500')}
                  style={{ width: `${((event.attendeesCount / (event.maxAttendees || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
                <span>{event.attendeesCount} registered</span>
                <span className={cn('font-medium', seatsLeft <= 10 ? 'text-danger-500' : 'text-accent-500')}>{seatsLeft} left</span>
              </div>
            </div>
          )}

          {event.isRegistered && (
            <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">QR Registration</h3>
              <div
                onClick={() => setShowQRCode(true)}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] py-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
              >
                <FiMaximize size={48} className="text-[var(--color-text-muted)]" />
                <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">QR Code</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] text-center px-4">Click to view registration QR code</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Registration Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={32} className="text-primary-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Register for Event?</h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You're about to register for <span className="font-medium text-[var(--color-text-primary)]">{event.title}</span>.
            {seatsLeft !== null && seatsLeft <= 10 && (
              <span className="block mt-1 text-danger-500 font-medium">Only {seatsLeft} seats remaining!</span>
            )}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleRegister} isLoading={registerEvent.isPending}>Confirm Registration</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Registration Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
            <FiX size={32} className="text-danger-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Cancel Registration?</h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to cancel your registration for <span className="font-medium text-[var(--color-text-primary)]">{event.title}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Registration</Button>
            <Button variant="danger" onClick={handleCancelRegistration} isLoading={registerEvent.isPending}>Cancel Registration</Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={showQRCode} onClose={() => setShowQRCode(false)} size="sm" title="Registration QR Code">
        <div className="flex flex-col items-center py-4">
          <div className="w-48 h-48 rounded-xl border-2 border-[var(--color-border-primary)] bg-white flex items-center justify-center">
            <div className="text-center">
              <FiMaximize size={64} className="text-[var(--color-text-muted)]" />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">QR Code</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
            Show this QR code at the event entrance for check-in
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Event: {event.title}</p>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} size="sm" title="Share Event">
        <div className="space-y-3 py-2">
          <p className="text-sm text-[var(--color-text-secondary)]">Share this event with your colleagues:</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" fullWidth onClick={() => { navigator.clipboard.writeText(window.location.href); setShowShareModal(false) }}>
              Copy Link
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.href)}`); setShowShareModal(false) }}>
              Twitter
            </Button>
            <Button variant="outline" size="sm" fullWidth onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`); setShowShareModal(false) }}>
              LinkedIn
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
