import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiUserPlus, FiUsers, FiTrash2, FiPlus, FiSearch, FiCheck, FiX } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { organizationService } from '@/api/organizationService'
import { searchService } from '@/api/searchService'
import { useCurrentOrganizationContext } from '@/features/organization/context/CurrentOrganizationContext'
import { extractList } from '@/lib/pagination'
import { pageTransition } from '@/animations'
import StatCard from '@/components/ui/StatCard'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { formatNumber } from '@/utils'

const EMPLOYEE_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'org_admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'faculty', label: 'Faculty / Dept Head' },
  { value: 'healthcare_professional', label: 'Healthcare Professional' },
  { value: 'healthcare_student', label: 'Healthcare Student' },
]

interface EmployeeRow {
  user_id: string
  full_name?: string
  profile_photo?: string
  role?: string
  designation?: string
  department?: string
}

interface DepartmentRow {
  id: string
  name: string
  head?: string
}

export default function OrgEmployeesPage() {
  const { orgId } = useCurrentOrganizationContext()
  const qc = useQueryClient()
  const targetId = orgId || ''

  const [userQuery, setUserQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; name: string } | null>(null)
  const [role, setRole] = useState('employee')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [deptName, setDeptName] = useState('')
  const [deptHead, setDeptHead] = useState('')

  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ['organizationEmployees', targetId],
    queryFn: () => organizationService.getEmployees(targetId, 1, 100).then(r => r.data),
    enabled: !!targetId,
  })

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ['organizationDepartments', targetId],
    queryFn: () => organizationService.getDepartments(targetId).then(r => r.data),
    enabled: !!targetId,
  })

  const { data: peopleData, isFetching: peopleFetching } = useQuery({
    queryKey: ['orgPeopleSearch', userQuery],
    queryFn: () => searchService.searchPeople(userQuery, 1, 8).then(r => r.data),
    enabled: !!targetId && userQuery.trim().length >= 2 && !selectedUser,
  })

  const people = extractList<{ user_id?: string; _id?: string; fullName?: string; username?: string }>(peopleData) ?? []
  const employees = (extractList<EmployeeRow>(empData) ?? []) as EmployeeRow[]
  const departments = ((deptData?.departments ?? []) as DepartmentRow[]) || []
  const employeeCount = employees.length

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['organizationEmployees', targetId] })
    qc.invalidateQueries({ queryKey: ['organizationDepartments', targetId] })
    qc.invalidateQueries({ queryKey: ['organization', targetId] })
    qc.invalidateQueries({ queryKey: ['currentOrganization'] })
  }

  const addMutation = useMutation({
    mutationFn: () => organizationService.addEmployee(targetId, {
      user_id: selectedUser!.user_id,
      role,
      designation,
      department,
    }),
    onSuccess: () => {
      toast.success('Employee added')
      setSelectedUser(null); setUserQuery(''); setDesignation(''); setDepartment('')
      invalidate()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add employee'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => organizationService.removeEmployee(targetId, userId),
    onSuccess: () => { toast.success('Employee removed'); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to remove employee'),
  })

  const addDeptMutation = useMutation({
    mutationFn: () => organizationService.addDepartment(targetId, { name: deptName, head: deptHead }),
    onSuccess: () => {
      toast.success(`Department "${deptName}" added`)
      setDeptName(''); setDeptHead('')
      invalidate()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add department'),
  })

  const delDeptMutation = useMutation({
    mutationFn: (deptId: string) => organizationService.deleteDepartment(targetId, deptId),
    onSuccess: () => { toast.success('Department removed'); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to remove department'),
  })

  const canAdd = !!selectedUser

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={<FiUsers size={20} />} label="Team Members" value={employeeCount} />
        <StatCard icon={<FiPlus size={20} />} label="Departments" value={departments.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
            <FiUserPlus size={16} className="text-primary-500" /> Add Employee
          </h2>
          <form
            onSubmit={(e) => { e.preventDefault(); if (canAdd && !addMutation.isPending) addMutation.mutate() }}
            className="space-y-4"
          >
            <div>
              <Input
                label="Search User"
                placeholder="Type a name, then pick from results"
                value={userQuery}
                onChange={(e) => { setUserQuery(e.target.value); setSelectedUser(null) }}
                autoComplete="off"
              />
              {selectedUser ? (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm">
                  <span className="font-medium text-[var(--color-text-primary)]">{selectedUser.name}</span>
                  <button type="button" onClick={() => { setSelectedUser(null); setUserQuery('') }} aria-label="Clear selection">
                    <FiX size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              ) : userQuery.trim().length >= 2 ? (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[var(--color-border-primary)]">
                  {peopleFetching ? (
                    <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Searching…</p>
                  ) : people.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">No users found</p>
                  ) : (
                    people.map((p) => {
                      const pid = p.user_id || p._id || ''
                      const pname = p.fullName || p.username || pid
                      return (
                        <button
                          type="button"
                          key={pid}
                          onClick={() => { setSelectedUser({ user_id: pid, name: pname }); setUserQuery('') }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)]"
                        >
                          <FiSearch size={12} className="text-[var(--color-text-muted)]" />
                          <span className="truncate text-[var(--color-text-primary)]">{pname}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Role" options={EMPLOYEE_ROLES} value={role} onChange={setRole} placeholder="Select role" />
              <Input label="Designation" placeholder="e.g. Nurse Manager" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </div>

            <div>
              <Input
                label="Department"
                placeholder={departments.length ? 'e.g. Cardiology' : 'Create a department first (right)'}
                list="org-dept-options"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <datalist id="org-dept-options">
                {departments.map(d => <option key={d.id} value={d.name} />)}
              </datalist>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={addMutation.isPending} disabled={!canAdd}>
                {canAdd ? 'Add Employee' : 'Select a user first'}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
            <FiPlus size={16} className="text-primary-500" /> Departments
          </h2>
          <form
            onSubmit={(e) => { e.preventDefault(); if (deptName.trim() && !addDeptMutation.isPending) addDeptMutation.mutate() }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input label="Department Name" placeholder="e.g. Cardiology" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
              <Input label="Head" placeholder="e.g. Dr. Rao" value={deptHead} onChange={(e) => setDeptHead(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={addDeptMutation.isPending} disabled={!deptName.trim()}>Add Department</Button>
            </div>
          </form>

          <div className="mt-4 space-y-2">
            {deptLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : departments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--color-border-primary)] px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                No departments yet. Add one above.
              </p>
            ) : (
              departments.map(d => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border-primary)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{d.name}</p>
                    {d.head && <p className="truncate text-xs text-[var(--color-text-muted)]">Head: {d.head}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => delDeptMutation.mutate(d.id)}
                    disabled={delDeptMutation.isPending}
                    aria-label={`Remove ${d.name}`}
                    className="ml-2 rounded p-1.5 text-danger-500 hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Current Team ({formatNumber(employeeCount)})</h2>
        {empLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : employees.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border-primary)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
            No employees yet. Use the Add Employee form above.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-primary)]">
            {employees.map(emp => (
              <li key={emp.user_id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={emp.profile_photo} name={emp.full_name || emp.user_id} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{emp.full_name || emp.user_id}</p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {[emp.designation, emp.department].filter(Boolean).join(' · ') || 'No designation'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="info" size="sm">{emp.role || 'employee'}</Badge>
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={removeMutation.isPending ? undefined : <FiTrash2 size={12} />}
                    isLoading={removeMutation.isPending && removeMutation.variables === emp.user_id}
                    onClick={() => removeMutation.mutate(emp.user_id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  )
}
