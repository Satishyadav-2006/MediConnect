import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSearch, FiMessageCircle, FiUser } from 'react-icons/fi'
import { useOrganizationEmployees } from '@/features/organization/hooks/useOrganization'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
import type { User } from '@/types'

export default function OrganizationEmployeesPage() {
  const { id } = useParams<{ id: string }>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrganizationEmployees(id || '')
  const employees = (data?.pages?.flatMap(p => extractList(p)) ?? []) as (User & { department?: string; designation?: string })[]
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  const filteredEmployees = search
    ? employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase()))
    : employees

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Employee Directory</h2>
        <span className="text-sm text-[var(--color-text-muted)]">{filteredEmployees.length} employees</span>
      </div>

      <div className="relative">
        <Input
          leftIcon={<FiSearch size={16} />}
          placeholder="Search employees by name or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
          <FiUser className="mx-auto mb-2 text-[var(--color-text-muted)]" size={32} />
          <p className="text-sm text-[var(--color-text-muted)]">
            {search ? 'No employees match your search.' : 'No employees listed yet.'}
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => (
            <motion.div key={emp._id} variants={staggerItem}>
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar src={emp.profilePhoto} name={emp.fullName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${emp.username || emp._id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-primary-500 truncate block">
                      {emp.fullName}
                    </Link>
                    {emp.designation && <p className="text-xs text-[var(--color-text-secondary)] truncate">{emp.designation}</p>}
                    {emp.department && (
                      <Badge variant="primary" size="sm" className="mt-1">{emp.department}</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={`/profile/${emp.username || emp._id}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth leftIcon={<FiUser size={14} />}>Profile</Button>
                  </Link>
                  <Button variant="ghost" size="sm" leftIcon={<FiMessageCircle size={14} />}>Message</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && !search && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />}
    </motion.div>
  )
}
