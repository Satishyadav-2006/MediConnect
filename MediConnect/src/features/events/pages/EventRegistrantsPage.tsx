import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/api/eventService'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { formatDate, getStatusColor, cn } from '@/utils'
import { extractList } from '@/lib/pagination'
import type { EventRegistrationRow, AttendanceStatus } from '@/types'

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Not marked' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
]

const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function useRegistrations(attendanceStatus?: string) {
  return useQuery({
    queryKey: ['organizedEventRegistrations', attendanceStatus ?? 'all'],
    queryFn: () => eventService.getOrganizedRegistrations(1, 100, attendanceStatus).then(r => r.data),
  })
}

function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, userId, status }: { eventId: string; userId: string; status: AttendanceStatus }) =>
      eventService.markAttendance(eventId, status, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizedEventRegistrations'] })
      toast.success('Attendance updated')
    },
    onError: () => toast.error('Failed to update attendance'),
  })
}

export default function EventRegistrantsPage() {
  const [filter, setFilter] = useState('all')
  const { data, isLoading } = useRegistrations(filter === 'all' ? undefined : filter)
  const mark = useMarkAttendance()

  const rows = extractList<EventRegistrationRow>(data)
  const presentCount = rows.filter(r => r.attendance_status === 'present').length

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Event Registrants</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Everyone registered for your events
            {rows.length > 0 && ` · ${presentCount}/${rows.length} present`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border-primary)] p-10 text-center">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No registrants yet</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            People who register for your events will appear here.
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {rows.map(reg => (
            <motion.div
              key={`${reg.event_id}-${reg.user_id}`}
              variants={staggerItem}
              className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                    {reg.user?.profile_photo ? (
                      <img src={reg.user.profile_photo} alt="" className="h-11 w-11 object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center text-sm font-bold text-primary-500">
                        {reg.user?.full_name?.[0] ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {reg.user?.full_name || 'Registrant'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{reg.user?.headline || reg.user?.role || '—'}</p>
                    {reg.user?.email && (
                      <a
                        href={`mailto:${reg.user.email}`}
                        className="text-xs text-primary-500 hover:underline"
                      >
                        {reg.user.email}
                      </a>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {reg.event && (
                        <Link
                          to={`/events/${reg.event.event_id}`}
                          className="font-medium text-[var(--color-text-primary)] hover:text-primary-500"
                        >
                          {reg.event.title}
                        </Link>
                      )}
                      <span className="text-[var(--color-text-muted)]">
                        Registered {formatDate(reg.registered_at || reg.created_at)}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 font-medium', getStatusColor(reg.attendance_status))}>
                        {formatStatus(reg.attendance_status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reg.registration_status === 'cancelled' ? (
                    <span className="text-xs text-[var(--color-text-muted)]">Cancelled</span>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mark.isPending}
                        onClick={() => mark.mutate({ eventId: reg.event_id, userId: reg.user_id, status: 'present' })}
                      >
                        Present
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mark.isPending}
                        onClick={() => mark.mutate({ eventId: reg.event_id, userId: reg.user_id, status: 'absent' })}
                      >
                        Absent
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
