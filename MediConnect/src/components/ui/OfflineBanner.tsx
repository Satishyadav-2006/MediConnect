import { AnimatePresence, motion } from 'framer-motion'
import { FiWifiOff } from 'react-icons/fi'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 bg-warning-500 px-4 py-3 text-white shadow-md"
          role="alert"
          aria-live="assertive"
        >
          <FiWifiOff size={20} />
          <div className="text-sm font-medium">
            <span>You're offline</span>
            <span className="ml-2 hidden sm:inline text-warning-50/90 font-normal">
              Some features may be unavailable
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
