import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/utils'

interface ImageLightboxProps {
  images: string[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export default function ImageLightbox({ images, isOpen, onClose, initialIndex = 0 }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => { setCurrentIndex(initialIndex) }, [initialIndex, isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const goNext = useCallback(() => {
    setZoomed(false)
    setCurrentIndex(prev => (prev + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setZoomed(false)
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, goNext, goPrev])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Image viewer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90"
            onClick={onClose}
            aria-hidden="true"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <FiX size={24} />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-sm text-white/70">
            {currentIndex + 1} of {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <FiChevronLeft size={28} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <FiChevronRight size={28} />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex max-h-[85vh] max-w-[85vw] items-center justify-center"
              onClick={() => setZoomed(z => !z)}
            >
              <img
                src={images[currentIndex]}
                alt=""
                className={cn(
                  'max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-200',
                  zoomed && 'scale-150 cursor-zoom-out',
                  !zoomed && 'cursor-zoom-in'
                )}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
