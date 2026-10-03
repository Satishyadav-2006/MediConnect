import { cn } from '@/utils'
import { Link } from 'react-router-dom'

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  withText?: boolean
  textClassName?: string
  linkTo?: string
  rounded?: boolean
}

const sizeMap: Record<NonNullable<LogoProps['size']>, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

export default function Logo({
  size = 'md',
  className,
  withText = false,
  textClassName,
  linkTo,
  rounded = false,
}: LogoProps) {
  const img = (
    <img
      src="/MediConnect_Logo.png"
      alt="MediConnect"
      className={cn('object-contain', sizeMap[size], rounded && 'rounded-lg', className)}
      loading="lazy"
    />
  )

  if (withText) {
    const content = (
      <span className="flex items-center gap-2">
        {img}
        <span className={cn('text-xl font-bold text-[var(--color-text-primary)]', textClassName)}>MediConnect</span>
      </span>
    )
    if (linkTo) return <Link to={linkTo} className="flex items-center">{content}</Link>
    return content
  }

  if (linkTo) return <Link to={linkTo} className="inline-flex items-center">{img}</Link>
  return img
}
