import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Error logging can be added here for production monitoring
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="app">
            <div className="header">
              <h1 className="title">Something went wrong</h1>
              <p className="subtitle muted">
                {this.state.error?.message ?? 'An unexpected error occurred'}
              </p>
              <button
                className="button"
                onClick={() => window.location.reload()}
                style={{ marginTop: '12px' }}
              >
                Reload page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
