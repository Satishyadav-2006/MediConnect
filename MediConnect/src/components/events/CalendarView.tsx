import { useState, useMemo } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/utils'

interface CalendarEvent {
  _id: string
  title: string
  date: string
  time?: string
  type?: string
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onDateClick?: (date: string) => void
  onEventClick?: (eventId: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarView({ events, onDateClick, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date()

  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach(e => {
      const dateKey = new Date(e.date).toISOString().split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(e)
    })
    return map
  }, [events])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1))

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
          <FiChevronLeft size={20} />
        </button>
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {MONTHS[month]} {year}
        </h3>
        <button onClick={nextMonth} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]">
          <FiChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium text-[var(--color-text-muted)]">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = eventMap[dateStr] || []
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

          return (
            <button
              key={day}
              onClick={() => onDateClick?.(dateStr)}
              className={cn(
                'relative flex h-12 flex-col items-center justify-start rounded-lg py-1 text-sm transition-colors hover:bg-[var(--color-bg-hover)]',
                isToday && 'bg-primary-50 font-bold text-primary-600 dark:bg-primary-900/20',
                dayEvents.length > 0 && 'font-medium'
              )}
            >
              <span>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((_, idx) => (
                    <span key={idx} className="h-1 w-1 rounded-full bg-primary-500" />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
