import { useEffect, useRef } from 'react'

export function useClickOutside(callback: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [callback])

  return ref
}

export function useIntersectionObserver(callback: () => void, options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
      }
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [callback, options])

  return ref
}
