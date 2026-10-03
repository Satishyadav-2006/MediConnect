import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile'
import { useAuth } from '@/contexts/AuthContext'
import { profileEditSchema, type ProfileEditFormData } from '@/validators'
import { pageTransition, slideUp } from '@/animations'
import { SKILLS, LANGUAGES } from '@/constants/options'
import { SPECIALIZATIONS } from '@/constants'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { Tabs, TabList, TabTrigger, TabContent } from '@/components/ui/Tabs'
import { profileService } from '@/api/profileService'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profileData, isLoading } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const [skills, setSkills] = useState<string[]>(user?.skills || [])
  const [languages, setLanguages] = useState<string[]>(user?.languages || [])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [education, setEducation] = useState(user?.education || [])
  const [experience, setExperience] = useState(user?.experience || [])
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', field: '', startDate: '', endDate: '', isCurrent: false })
  const [newExp, setNewExp] = useState({ organization: '', title: '', employmentType: 'full_time', startDate: '', endDate: '', isCurrent: false, location: '' })

  const profile = profileData?.data?.user || profileData?.data || user

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !profileData) return
    seeded.current = true
    setSkills(profile?.skills || [])
    setLanguages(profile?.languages || [])
    setEducation(profile?.education || [])
    setExperience(profile?.experience || [])
  }, [profileData, profile])

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      headline: profile?.headline || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      country: profile?.country || '',
      state: profile?.state || '',
      city: profile?.city || '',
      specialization: profile?.specialization || '',
      licenseNumber: profile?.licenseNumber || '',
      yearsOfExperience: profile?.yearsOfExperience || undefined,
      currentOrganization: profile?.currentOrganization || '',
      department: profile?.department || '',
    },
  })

  const onSubmit = async (data: ProfileEditFormData) => {
    const nameParts = (data.fullName || '').trim().split(' ')
    try {
      await updateProfile.mutateAsync({
        first_name: nameParts[0] || undefined,
        last_name: nameParts.slice(1).join(' ') || undefined,
        headline: data.headline || undefined,
        bio: data.bio || undefined,
        country: data.country || undefined,
        state: data.state || undefined,
        city: data.city || undefined,
        specialization: data.specialization || undefined,
        license_number: data.licenseNumber || undefined,
        experience_years: data.yearsOfExperience !== undefined ? data.yearsOfExperience : undefined,
        department: data.department || undefined,
      })
      toast.success('Profile updated successfully')
      navigate(`/profile/${user?.username}`)
    } catch {
      toast.error('Failed to update profile. Please try again.')
    }
  }

  const addSkill = async () => {
    if (!selectedSkill || skills.includes(selectedSkill)) return
    try {
      await profileService.addSkill({ skill_name: selectedSkill })
      setSkills(prev => [...prev, selectedSkill])
      setSelectedSkill('')
    } catch { /* handled */ }
  }

  const removeSkill = async (skill: string) => {
    const idx = profile?.skills?.indexOf(skill) ?? -1
    const target = idx >= 0 ? idx : skills.indexOf(skill)
    if (target < 0) return
    try {
      await profileService.deleteSkill(target)
      setSkills(prev => prev.filter(s => s !== skill))
    } catch { /* handled */ }
  }

  const addLanguage = async () => {
    if (!selectedLanguage || languages.includes(selectedLanguage)) return
    try {
      await profileService.addLanguage({ language: selectedLanguage })
      setLanguages(prev => [...prev, selectedLanguage])
      setSelectedLanguage('')
    } catch { /* handled */ }
  }

  const removeLanguage = async (lang: string) => {
    const idx = profile?.languages?.indexOf(lang) ?? -1
    const target = idx >= 0 ? idx : languages.indexOf(lang)
    if (target < 0) return
    try {
      await profileService.deleteLanguage(target)
      setLanguages(prev => prev.filter(l => l !== lang))
    } catch { /* handled */ }
  }

  const addEducation = async () => {
    if (!newEdu.institution || !newEdu.degree) return
    try {
      const res = await profileService.addEducation(newEdu)
      setEducation(prev => [...prev, res.data.data || res.data])
      setNewEdu({ institution: '', degree: '', field: '', startDate: '', endDate: '', isCurrent: false })
    } catch { /* handled */ }
  }

  const removeEducation = async (id: string) => {
    try {
      await profileService.deleteEducation(id)
      setEducation(prev => prev.filter((e: { _id: string }) => e._id !== id))
    } catch { /* handled */ }
  }

  const addExperienceEntry = async () => {
    if (!newExp.organization || !newExp.title) return
    try {
      const res = await profileService.addExperience(newExp)
      setExperience(prev => [...prev, res.data.data || res.data])
      setNewExp({ organization: '', title: '', employmentType: 'full_time', startDate: '', endDate: '', isCurrent: false, location: '' })
    } catch { /* handled */ }
  }

  const removeExperience = async (id: string) => {
    try {
      await profileService.deleteExperience(id)
      setExperience(prev => prev.filter((e: { _id: string }) => e._id !== id))
    } catch { /* handled */ }
  }

  if (isLoading) {
    return (
      <motion.div {...pageTransition} className="mx-auto max-w-3xl space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </motion.div>
    )
  }

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Edit Profile</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal">
          <TabList>
            <TabTrigger value="personal">Personal Info</TabTrigger>
            <TabTrigger value="professional">Professional</TabTrigger>
            <TabTrigger value="skills">Skills & Languages</TabTrigger>
            <TabTrigger value="education">Education</TabTrigger>
            <TabTrigger value="experience">Experience</TabTrigger>
          </TabList>

          <TabContent value="personal">
            <motion.div {...slideUp} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
              <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
              <Input label="Headline" placeholder="e.g. Cardiologist at Mayo Clinic" {...register('headline')} error={errors.headline?.message} />
              <Textarea label="Bio" rows={4} placeholder="Tell others about yourself..." {...register('bio')} error={errors.bio?.message} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Country" {...register('country')} />
                <Input label="State" {...register('state')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="City" {...register('city')} />
                <Input label="Location" placeholder="e.g. New York, NY" {...register('location')} />
              </div>
            </motion.div>
          </TabContent>

          <TabContent value="professional">
            <motion.div {...slideUp} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-4">
              <Select
                label="Specialization"
                options={SPECIALIZATIONS.map(s => ({ value: s, label: s }))}
                value={undefined}
                onChange={(v) => register('specialization').onChange({ target: { value: v } })}
                placeholder="Select specialization..."
              />
              <Input label="License Number" {...register('licenseNumber')} error={errors.licenseNumber?.message} />
              <Input label="Years of Experience" type="number" {...register('yearsOfExperience', { valueAsNumber: true })} error={errors.yearsOfExperience?.message} />
              <Input label="Current Organization" {...register('currentOrganization')} />
              <Input label="Department" {...register('department')} />
            </motion.div>
          </TabContent>

          <TabContent value="skills">
            <motion.div {...slideUp} className="space-y-6">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(skill => (
                    <Badge key={skill} variant="primary" removable onRemove={() => removeSkill(skill)}>{skill}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select
                    options={SKILLS.filter(s => !skills.includes(s)).map(s => ({ value: s, label: s }))}
                    value={selectedSkill}
                    onChange={setSelectedSkill}
                    placeholder="Add a skill..."
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addSkill} disabled={!selectedSkill}>
                    <FiPlus size={16} />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {languages.map(lang => (
                    <Badge key={lang} variant="primary" removable onRemove={() => removeLanguage(lang)}>{lang}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select
                    options={LANGUAGES.filter(l => !languages.includes(l)).map(l => ({ value: l, label: l }))}
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    placeholder="Add a language..."
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addLanguage} disabled={!selectedLanguage}>
                    <FiPlus size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabContent>

          <TabContent value="education">
            <motion.div {...slideUp} className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
                {education.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {education.map((edu: { _id: string; institution: string; degree: string; field: string }) => (
                      <div key={edu._id} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-tertiary)] p-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.degree} in {edu.field}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{edu.institution}</p>
                        </div>
                        <button type="button" onClick={() => removeEducation(edu._id)} className="text-danger-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Add Education</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Institution" value={newEdu.institution} onChange={e => setNewEdu(p => ({ ...p, institution: e.target.value }))} />
                  <Input label="Degree" value={newEdu.degree} onChange={e => setNewEdu(p => ({ ...p, degree: e.target.value }))} />
                </div>
                <Input label="Field of Study" value={newEdu.field} onChange={e => setNewEdu(p => ({ ...p, field: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" value={newEdu.startDate} onChange={e => setNewEdu(p => ({ ...p, startDate: e.target.value }))} />
                  <Input label="End Date" type="date" value={newEdu.endDate} onChange={e => setNewEdu(p => ({ ...p, endDate: e.target.value }))} disabled={newEdu.isCurrent} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="checkbox" checked={newEdu.isCurrent} onChange={e => setNewEdu(p => ({ ...p, isCurrent: e.target.checked }))} className="rounded" />
                  Currently studying here
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addEducation} disabled={!newEdu.institution || !newEdu.degree}>
                  <FiPlus size={14} /> Add Education
                </Button>
              </div>
            </motion.div>
          </TabContent>

          <TabContent value="experience">
            <motion.div {...slideUp} className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
                {experience.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {experience.map((exp: { _id: string; title: string; organization: string }) => (
                      <div key={exp._id} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-tertiary)] p-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{exp.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{exp.organization}</p>
                        </div>
                        <button type="button" onClick={() => removeExperience(exp._id)} className="text-danger-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Add Experience</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Title" value={newExp.title} onChange={e => setNewExp(p => ({ ...p, title: e.target.value }))} />
                  <Input label="Organization" value={newExp.organization} onChange={e => setNewExp(p => ({ ...p, organization: e.target.value }))} />
                </div>
                <Select
                  label="Employment Type"
                  options={[
                    { value: 'full_time', label: 'Full Time' },
                    { value: 'part_time', label: 'Part Time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'volunteer', label: 'Volunteer' },
                  ]}
                  value={newExp.employmentType}
                  onChange={(v) => setNewExp(p => ({ ...p, employmentType: v }))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Start Date" type="date" value={newExp.startDate} onChange={e => setNewExp(p => ({ ...p, startDate: e.target.value }))} />
                  <Input label="End Date" type="date" value={newExp.endDate} onChange={e => setNewExp(p => ({ ...p, endDate: e.target.value }))} disabled={newExp.isCurrent} />
                </div>
                <Input label="Location" value={newExp.location} onChange={e => setNewExp(p => ({ ...p, location: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="checkbox" checked={newExp.isCurrent} onChange={e => setNewExp(p => ({ ...p, isCurrent: e.target.checked }))} className="rounded" />
                  Currently working here
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addExperienceEntry} disabled={!newExp.organization || !newExp.title}>
                  <FiPlus size={14} /> Add Experience
                </Button>
              </div>
            </motion.div>
          </TabContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={updateProfile.isPending} leftIcon={<FiSave size={16} />}>Save Changes</Button>
        </div>
      </form>
    </motion.div>
  )
}
