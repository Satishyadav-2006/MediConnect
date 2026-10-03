import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const variantConfig = {
  danger: {
    icon: <FiAlertTriangle size={24} className="text-danger-500" />,
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: <FiAlertCircle size={24} className="text-orange-500" />,
    buttonVariant: 'primary' as const,
  },
  info: {
    icon: <FiInfo size={24} className="text-primary-500" />,
    buttonVariant: 'primary' as const,
  },
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" aria-labelledby="confirmation-title" aria-describedby="confirmation-message">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
          {config.icon}
        </div>
        <div>
          <h3 id="confirmation-title" className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <p id="confirmation-message" className="mt-1 text-sm text-[var(--color-text-secondary)]">{message}</p>
        </div>
        <div className="flex w-full gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} fullWidth onClick={onConfirm} isLoading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
