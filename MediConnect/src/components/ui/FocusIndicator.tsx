import { useEffect } from 'react'

export default function FocusIndicator() {
  useEffect(() => {
    let usingKeyboard = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        usingKeyboard = true
        document.documentElement.classList.add('keyboard-nav')
      }
    }

    const handleMouseDown = () => {
      usingKeyboard = false
      document.documentElement.classList.remove('keyboard-nav')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return null
}
