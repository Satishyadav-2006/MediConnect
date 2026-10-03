import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})
export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain an uppercase letter').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  role: z.enum(['doctor', 'nurse', 'hospital', 'clinic']),
  specialization: z.string().optional(),
  organizationName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export type RegisterFormData = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain an uppercase letter').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
})
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>

export const profileEditSchema = z.object({
  fullName: z.string().min(2).max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(60).optional(),
  currentOrganization: z.string().optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
})
export type ProfileEditFormData = z.infer<typeof profileEditSchema>

export const postSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(5000),
  visibility: z.enum(['public', 'connections', 'private']),
  images: z.array(z.string()).max(10).optional(),
  tags: z.array(z.string()).optional(),
})
export type PostFormData = z.infer<typeof postSchema>

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
})
export type CommentFormData = z.infer<typeof commentSchema>

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
})
export type MessageFormData = z.infer<typeof messageSchema>

export const jobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  requirements: z.array(z.string()).min(1, 'At least one requirement needed'),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility needed'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'volunteer', 'temporary']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  isRemote: z.boolean().default(false),
  location: z.string().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill needed'),
  benefits: z.array(z.string()).optional(),
  applicationDeadline: z.string().optional(),
})
export type JobFormData = z.infer<typeof jobSchema>

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  mode: z.enum(['online', 'in_person', 'hybrid']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  onlineLink: z.string().url().optional(),
  maxAttendees: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
})
export type EventFormData = z.infer<typeof eventSchema>

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.enum(['all', 'people', 'organizations', 'jobs', 'internships', 'events', 'posts']).default('all'),
})
export type SearchFormData = z.infer<typeof searchSchema>
