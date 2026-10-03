import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSearch, FiX, FiTrendingUp } from 'react-icons/fi'
import { useSearch, useAutocomplete, useTrendingSearches } from '@/features/search/hooks/useSearch'
import { SEARCH_CATEGORIES } from '@/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { NoSearchResultsEmpty } from '@/components/empty-states'
import JobCard from '@/components/jobs/JobCard'
import EventCard from '@/components/events/EventCard'
import PostCard from '@/components/feed/PostCard'
import { cn, formatDate } from '@/utils'
import { debounce } from '@/utils'
import type { User, Organization, Job, Internship, Event, Post, SearchResult } from '@/types'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)
  const [activeQuery, setActiveQuery] = useState(urlQuery)
  const [category, setCategory] = useState('all')
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  useEffect(() => {
    setQuery(urlQuery)
    setActiveQuery(urlQuery)
    setShowAutocomplete(false)
  }, [urlQuery])

  const { data: searchData, isLoading: searchLoading } = useSearch(activeQuery, category)
  const { data: autocompleteData } = useAutocomplete(query)
  const { data: trendingData } = useTrendingSearches()

  const results = (searchData?.data || searchData) as SearchResult | undefined
  const autocomplete = (autocompleteData?.data || autocompleteData || []) as { text: string; type: string }[]
  const trending = (trendingData?.data || trendingData || []) as { text: string; count: number }[]

  const debouncedSearch = useCallback(
    debounce((val: string) => { setActiveQuery(val); setShowAutocomplete(false) }, 500),
    []
  )

  const handleInputChange = (val: string) => {
    setQuery(val)
    setShowAutocomplete(val.length >= 2)
    if (val.length >= 2) debouncedSearch(val)
  }

  const selectSuggestion = (text: string) => {
    setQuery(text)
    setActiveQuery(text)
    setShowAutocomplete(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveQuery(query)
    setShowAutocomplete(false)
  }

  const ResultItem = ({ type, children }: { type: string; children: React.ReactNode }) => (
    <motion.div variants={staggerItem} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
      {children}
    </motion.div>
  )

  const hasResults = results && (
    (results.users?.length > 0) || (results.organizations?.length > 0) ||
    (results.jobs?.length > 0) || (results.internships?.length > 0) ||
    (results.events?.length > 0) || (results.posts?.length > 0)
  )

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-4xl space-y-4">
      <div className="relative">
        <form onSubmit={handleSearch}>
          <Input
            placeholder="Search for people, organizations, jobs, events..."
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => query.length >= 2 && setShowAutocomplete(true)}
            leftIcon={<FiSearch size={16} />}
            rightIcon={query ? (
              <button type="button" onClick={() => { setQuery(''); setActiveQuery(''); setShowAutocomplete(false) }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <FiX size={16} />
              </button>
            ) : undefined}
            className="text-base py-3"
          />
        </form>

        {showAutocomplete && autocomplete.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg">
            {autocomplete.slice(0, 8).map((item, i) => (
              <button key={i} onClick={() => selectSuggestion(item.text)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-bg-hover)]">
                <FiSearch size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-primary)]">{item.text}</span>
                <Badge variant="default" size="sm" className="ml-auto">{item.type}</Badge>
              </button>
            ))}
          </div>
        )}

        {showAutocomplete && autocomplete.length === 0 && trending.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg p-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 flex items-center gap-1"><FiTrendingUp size={12} /> Trending</p>
            {trending.slice(0, 5).map((item, i) => (
              <button key={i} onClick={() => selectSuggestion(item.text)} className="flex w-full items-center gap-2 py-1.5 text-left hover:bg-[var(--color-bg-hover)] rounded-lg px-2">
                <span className="text-sm text-[var(--color-text-primary)]">{item.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!activeQuery ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
          {trending.length > 0 ? (
            <>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Trending Searches</h3>
              <div className="flex flex-wrap gap-2">
                {trending.map((item, i) => (
                  <button key={i} onClick={() => selectSuggestion(item.text)} className="rounded-full border border-[var(--color-border-primary)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]">
                    {item.text}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-[var(--color-text-muted)] py-4">Start typing to search</p>
          )}
        </div>
      ) : searchLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      ) : !hasResults ? (
        <NoSearchResultsEmpty />
      ) : (
        <Tabs defaultValue={category}>
          <TabList>
            {SEARCH_CATEGORIES.map(cat => (
              <TabTrigger key={cat.value} value={cat.value} onClick={() => setCategory(cat.value)}>
                {cat.label}
              </TabTrigger>
            ))}
          </TabList>

          <TabContent value="all">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
              {results.users && results.users.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">People</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.users.slice(0, 4).map(u => (
                      <ResultItem key={u._id} type="user">
                        <Link to={`/profile/${u.username}`} className="flex items-center gap-3">
                          <Avatar src={u.profilePhoto} name={u.fullName} />
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{u.fullName}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{u.headline || u.specialization}</p>
                          </div>
                        </Link>
                      </ResultItem>
                    ))}
                  </div>
                </section>
              )}

              {results.organizations && results.organizations.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Organizations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.organizations.slice(0, 4).map((org: Organization) => (
                      <ResultItem key={org._id} type="org">
                        <Link to={`/organizations/${org._id}`} className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                            {org.logo ? <img src={org.logo} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="font-bold text-primary-500">{org.name[0]}</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{org.name}</p>
                              {org.isVerified && <span className="text-primary-500">✓</span>}
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)]">{org.type.replace('_', ' ')} · {org.employeesCount} employees</p>
                          </div>
                        </Link>
                      </ResultItem>
                    ))}
                  </div>
                </section>
              )}

              {results.jobs && results.jobs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Jobs</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {results.jobs.slice(0, 3).map((job: Job) => <JobCard key={job._id} job={job} />)}
                  </div>
                </section>
              )}

              {results.internships && results.internships.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Internships</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.internships.slice(0, 4).map((intern: Internship) => (
                      <ResultItem key={intern._id} type="internship">
                        <Link to={`/internships/${intern._id}`}>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{intern.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{intern.organization.name}</p>
                        </Link>
                      </ResultItem>
                    ))}
                  </div>
                </section>
              )}

              {results.events && results.events.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Events</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.events.slice(0, 4).map((event: Event) => <EventCard key={event._id} event={event} />)}
                  </div>
                </section>
              )}

              {results.posts && results.posts.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Posts</h3>
                  <div className="space-y-3">
                    {results.posts.slice(0, 3).map((post: Post) => <PostCard key={post._id} post={post} />)}
                  </div>
                </section>
              )}
            </motion.div>
          </TabContent>

          <TabContent value="people">
            {results.users && results.users.length > 0 ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.users.map(u => (
                  <ResultItem key={u._id} type="user">
                    <Link to={`/profile/${u.username}`} className="flex items-center gap-3">
                      <Avatar src={u.profilePhoto} name={u.fullName} />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{u.fullName}</p>
                          {u.accountStatus === 'active' && <Badge variant="primary" size="sm">Verified</Badge>}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">{u.headline || u.specialization}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{u.connectionsCount} connections</p>
                      </div>
                    </Link>
                  </ResultItem>
                ))}
              </motion.div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>

          <TabContent value="jobs">
            {results.jobs && results.jobs.length > 0 ? (
              <div className="space-y-3">{results.jobs.map((job: Job) => <JobCard key={job._id} job={job} />)}</div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>

          <TabContent value="events">
            {results.events && results.events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{results.events.map((event: Event) => <EventCard key={event._id} event={event} />)}</div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>

          <TabContent value="posts">
            {results.posts && results.posts.length > 0 ? (
              <div className="space-y-3">{results.posts.map((post: Post) => <PostCard key={post._id} post={post} />)}</div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>

          <TabContent value="organizations">
            {results.organizations && results.organizations.length > 0 ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.organizations.map((org: Organization) => (
                  <ResultItem key={org._id} type="org">
                    <Link to={`/organizations/${org._id}`} className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
                        {org.logo ? <img src={org.logo} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <span className="text-lg font-bold text-primary-500">{org.name[0]}</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{org.name}</p>
                          {org.isVerified && <span className="text-primary-500">✓</span>}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] capitalize">{org.type.replace('_', ' ')}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{org.employeesCount} employees</p>
                      </div>
                    </Link>
                  </ResultItem>
                ))}
              </motion.div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>

          <TabContent value="internships">
            {results.internships && results.internships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.internships.map((intern: Internship) => (
                  <ResultItem key={intern._id} type="internship">
                    <Link to={`/internships/${intern._id}`}>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500">{intern.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{intern.organization.name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {intern.skills.slice(0, 3).map(s => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
                      </div>
                    </Link>
                  </ResultItem>
                ))}
              </div>
            ) : <NoSearchResultsEmpty />}
          </TabContent>
        </Tabs>
      )}
    </motion.div>
  )
}
