export interface ApiResponse<T = unknown> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
  timestamp: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface ApiRequestConfig {
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  retries?: number
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  jitter: boolean
}

export interface CacheConfig {
  ttl: number
  maxSize?: number
  strategy?: 'lru' | 'fifo' | 'lfu'
}
