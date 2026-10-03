import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from '@/components/ui/Button'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{this.state.error?.message}</p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4">
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
