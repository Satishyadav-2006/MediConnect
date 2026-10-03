import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorService } from '@/api/mentorService'
import { extractList } from '@/lib/pagination'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import MentorshipSessions from '@/components/mentorship/MentorshipSessions'
import { formatDate, getStatusColor, cn } from '@/utils'
import type { MentorRequest } from '@/types'

const REQUEST_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
]

function useMentorRequests() {
  const { data, isLoading } = useQuery({
    queryKey: ['myMentorRequests'],
    queryFn: () => mentorService.getMyRequests(1, 100).then(r => r.data),
  })
  return { data, isLoading }
}

export default function MentorRequestsPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const qc = useQueryClient()
  const { data, isLoading } = useMentorRequests()

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => mentorService.acceptRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myMentorRequests'] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
      toast.success('Request accepted')
    },
    onError: () => toast.error('Failed to accept request'),
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => mentorService.rejectRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myMentorRequests'] })
      qc.invalidateQueries({ queryKey: ['mentorDashboard'] })
      toast.success('Request rejected')
    },
    onError: () => toast.error('Failed to reject request'),
  })

  const requests = extractList<MentorRequest>(data)
  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mentorship Requests</h1>

      <Tabs defaultValue="pending">
        <TabList>
          {REQUEST_TABS.map(tab => (
            <TabTrigger key={tab.value} value={tab.value} onClick={() => setActiveTab(tab.value)}>
              {tab.label}
            </TabTrigger>
          ))}
        </TabList>

        <TabContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-[var(--color-text-secondary)]">No {activeTab} requests</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
              {filtered.map(request => (
                <motion.div key={request._id} variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={request.mentee?.fullName}
                      src={request.mentee?.profilePhoto}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{request.mentee?.fullName}</h3>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusColor(request.status))}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{request.mentee?.specialization || request.mentee?.headline}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">{request.message}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">{formatDate(request.createdAt)}</p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptMutation.mutate(request._id)}
                          isLoading={acceptMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectMutation.mutate(request._id)}
                          disabled={rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <Link to="/messages" className="shrink-0">
                        <Button variant="outline" size="sm">Message</Button>
                      </Link>
                    )}
                  </div>
                  {request.status === 'accepted' && (
                    <MentorshipSessions mentorshipId={request._id} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabContent>
      </Tabs>
    </motion.div>
  )
}


