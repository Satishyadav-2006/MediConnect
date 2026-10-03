import { Toaster, toast } from 'react-hot-toast'
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

const toasterOptions = {
  position: 'top-right' as const,
  duration: 4000,
  style: {
    borderRadius: '8px',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-primary)',
    fontSize: '14px',
    padding: '12px 16px',
  },
}

export function ToasterConfig() {
  return <Toaster toastOptions={toasterOptions} />
}

export function showSuccess(message: string) {
  toast.custom(
    (t) => (
      <div role="alert" aria-live="assertive" className={`flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg transition-all ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <FiCheckCircle size={18} className="shrink-0 text-green-600" />
        <span className="text-sm text-green-800">{message}</span>
      </div>
    ),
    { duration: 4000 }
  )
}

export function showError(message: string) {
  toast.custom(
    (t) => (
      <div role="alert" aria-live="assertive" className={`flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg transition-all ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <FiXCircle size={18} className="shrink-0 text-red-600" />
        <span className="text-sm text-red-800">{message}</span>
      </div>
    ),
    { duration: 4000 }
  )
}

export function showWarning(message: string) {
  toast.custom(
    (t) => (
      <div role="alert" aria-live="polite" className={`flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 shadow-lg transition-all ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <FiAlertTriangle size={18} className="shrink-0 text-orange-600" />
        <span className="text-sm text-orange-800">{message}</span>
      </div>
    ),
    { duration: 4000 }
  )
}

export function showInfo(message: string) {
  toast.custom(
    (t) => (
      <div role="alert" aria-live="polite" className={`flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg transition-all ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <FiInfo size={18} className="shrink-0 text-blue-600" />
        <span className="text-sm text-blue-800">{message}</span>
      </div>
    ),
    { duration: 4000 }
  )
}
