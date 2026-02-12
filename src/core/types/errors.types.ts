// Error Handling Types

// Base Error Types
export interface AppError {
  message: string
  code: string
  timestamp: string
  context?: Record<string, unknown>
  statusCode?: number
  isRetryable?: boolean
}

// API Error Types
export interface ApiError extends AppError {
  statusCode: number
  isRetryable: boolean
}

export interface NetworkError extends AppError {
  statusCode: 0
  isRetryable: true
}

export interface TimeoutError extends AppError {
  statusCode: 408
  isRetryable: true
  timeout: number
  context: Record<string, unknown>
}

export interface RateLimitError extends AppError {
  statusCode: 429
  isRetryable: true
  retryAfter: number
}

export interface ValidationError extends AppError {
  statusCode: 400
  isRetryable: false
  field?: string
  context: Record<string, unknown>
}

export interface NotFoundError extends AppError {
  statusCode: 404
  isRetryable: false
  resource?: string
}

export interface UnauthorizedError extends AppError {
  statusCode: 401
  isRetryable: false
}

export interface ForbiddenError extends AppError {
  statusCode: 403
  isRetryable: false
}

// Domain Error Types
export interface DomainError extends AppError {
  statusCode: 400
  isRetryable: false
}

export interface BusinessRuleError extends DomainError {
  rule: string
}

export interface DataIntegrityError extends DomainError {
  message: string
}

export interface CalculationError extends DomainError {
  message: string
  calculation: string
}

// Error Handler Interface
export interface IErrorHandler {
  handle(error: Error): void
  canHandle(error: Error): boolean
  priority: number
}

// Error Handler Registry
export interface IErrorHandlerRegistry {
  register(handler: IErrorHandler): void
  unregister(handler: IErrorHandler): void
  handle(error: Error): void
  getHandlers(): IErrorHandler[]
}

// Error Context
export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  path?: string
  method?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// Error Reporting
export interface IErrorReporter {
  report(error: Error, context?: ErrorContext): Promise<void>
  reportBatch(errors: Error[], context?: ErrorContext): Promise<void>
}

// Error Recovery
export interface IErrorRecovery {
  canRecover(error: Error): boolean
  recover(error: Error): Promise<unknown>
  getRetryDelay(attempt: number): number
}

// Error Monitoring
export interface IErrorMonitor {
  track(error: Error, context?: ErrorContext): void
  getMetrics(): {
    totalErrors: number
    errorsByType: Record<string, number>
    errorsByCode: Record<string, number>
    recentErrors: Array<{
      error: string
      timestamp: string
      context?: ErrorContext
    }>
  }
}

// Error Factory
export class ErrorFactory {
  static createApiError(message: string, code: string, statusCode: number, context?: Record<string, unknown>): ApiError {
    return {
      message,
      code,
      timestamp: new Date().toISOString(),
      context,
      statusCode,
      isRetryable: statusCode >= 500 || statusCode === 429
    }
  }

  static createNetworkError(message: string, context?: Record<string, unknown>): NetworkError {
    return {
      message,
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      context,
      statusCode: 0,
      isRetryable: true
    }
  }

  static createTimeoutError(message: string, timeout: number, context?: Record<string, unknown>): TimeoutError {
    return {
      message,
      code: 'TIMEOUT_ERROR',
      timestamp: new Date().toISOString(),
      timeout,
      context: context || { timeout },
      statusCode: 408,
      isRetryable: true
    }
  }

  static createRateLimitError(message: string, retryAfter: number, context?: Record<string, unknown>): RateLimitError {
    return {
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      context: { ...context, retryAfter },
      statusCode: 429,
      isRetryable: true,
      retryAfter
    }
  }

  static createValidationError(message: string, field?: string, context?: Record<string, unknown>): ValidationError {
    return {
      message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      context: { ...context, field },
      statusCode: 400,
      isRetryable: false,
      field
    }
  }

  static createNotFoundError(message: string, resource?: string, context?: Record<string, unknown>): NotFoundError {
    return {
      message,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      context: { ...context, resource },
      statusCode: 404,
      isRetryable: false
    }
  }

  static createBusinessRuleError(message: string, rule: string, context?: Record<string, unknown>): BusinessRuleError {
    return {
      message,
      code: `BUSINESS_RULE_${rule}`,
      timestamp: new Date().toISOString(),
      context: { ...context, rule },
      statusCode: 400,
      isRetryable: false,
      rule
    }
  }

  static createDataIntegrityError(message: string, context?: Record<string, unknown>): DataIntegrityError {
    return {
      message,
      code: 'DATA_INTEGRITY',
      timestamp: new Date().toISOString(),
      context,
      statusCode: 400,
      isRetryable: false
    }
  }

  static createCalculationError(message: string, calculation: string, context?: Record<string, unknown>): CalculationError {
    return {
      message,
      code: `CALCULATION_${calculation}`,
      timestamp: new Date().toISOString(),
      context,
      statusCode: 400,
      isRetryable: false,
      calculation
    }
  }
}

// Error Types Union
export type AppErrorType = 
  | ApiError
  | NetworkError
  | TimeoutError
  | RateLimitError
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError
  | DomainError
  | BusinessRuleError
  | DataIntegrityError
  | CalculationError
