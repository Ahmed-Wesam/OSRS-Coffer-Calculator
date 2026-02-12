// External System Adapter Interfaces

import type { Item, MarketData, VolumeData, DeathCofferItem } from '../types/domain.types'
import type { ApiResponse, ApiRequestConfig, RetryConfig } from '../types/api.types'

// Base Adapter Interface
export interface IAdapter<TConfig = Record<string, unknown>> {
  initialize(config: TConfig): Promise<void>
  isHealthy(): Promise<boolean>
  shutdown(): Promise<void>
  getConfig(): TConfig
}

// API Adapter Interfaces
export interface IApiAdapter extends IAdapter<ApiAdapterConfig> {
  request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>>
  get<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>
  post<T>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>
  put<T>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>
  delete<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>
}

export interface ApiAdapterConfig {
  baseURL: string
  timeout: number
  retries: RetryConfig
  headers: Record<string, string>
  rateLimit: {
    maxRequests: number
    windowMs: number
  }
  cache?: {
    enabled: boolean
    ttl: number
  }
}

// Cache Adapter Interfaces
export interface ICacheAdapter extends IAdapter<CacheAdapterConfig> {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  exists(key: string): Promise<boolean>
  keys(pattern?: string): Promise<string[]>
  ttl(key: string): Promise<number>
  setTtl(key: string, ttl: number): Promise<void>
  size(): Promise<number>
}

export interface CacheAdapterConfig {
  type: 'memory' | 'redis' | 'file'
  maxSize?: number
  defaultTtl: number
  cleanupInterval?: number
  connection?: string // For Redis or file path
}

// Storage Adapter Interfaces
export interface IStorageAdapter extends IAdapter<StorageAdapterConfig> {
  read<T>(path: string): Promise<T | null>
  write<T>(path: string, data: T): Promise<void>
  exists(path: string): Promise<boolean>
  delete(path: string): Promise<boolean>
  list(prefix?: string): Promise<Array<{
    path: string
    size: number
    lastModified: string
  }>>
  copy(source: string, destination: string): Promise<void>
  move(source: string, destination: string): Promise<void>
}

export interface StorageAdapterConfig {
  type: 'local' | 's3' | 'blob' | 'database'
  basePath?: string
  connection?: string
  encryption?: {
    enabled: boolean
    algorithm: string
    key: string
  }
  compression?: {
    enabled: boolean
    algorithm: string
  }
}

// Database Adapter Interfaces
export interface IDatabaseAdapter extends IAdapter<DatabaseAdapterConfig> {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  execute(sql: string, params?: unknown[]): Promise<{
    affectedRows: number
    insertId?: number
  }>
  transaction<T>(callback: (trx: IDatabaseTransaction) => Promise<T>): Promise<T>
  beginTransaction(): Promise<IDatabaseTransaction>
  migrate(): Promise<void>
  seed(): Promise<void>
}

export interface IDatabaseTransaction {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  execute(sql: string, params?: unknown[]): Promise<{
    affectedRows: number
    insertId?: number
  }>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface DatabaseAdapterConfig {
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  connection: string
  pool?: {
    min: number
    max: number
    idle: number
  }
  migrations?: {
    path: string
    autoRun: boolean
  }
  seeds?: {
    path: string
    autoRun: boolean
  }
}

// Event Adapter Interfaces
export interface IEventAdapter extends IAdapter<EventAdapterConfig> {
  emit(event: string, data: unknown): Promise<void>
  on(event: string, listener: (data: unknown) => void): void
  off(event: string, listener: (data: unknown) => void): void
  once(event: string, listener: (data: unknown) => void): void
  emitAsync(event: string, data: unknown): Promise<void>
}

export interface EventAdapterConfig {
  type: 'memory' | 'redis' | 'rabbitmq' | 'kafka'
  connection?: string
  namespace?: string
  maxListeners?: number
}

// Logging Adapter Interfaces
export interface ILoggingAdapter extends IAdapter<LoggingAdapterConfig> {
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, error?: Error, data?: unknown): void
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void
  createChild(context: string): ILoggingAdapter
}

export interface LoggingAdapterConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  format: 'json' | 'text'
  output: 'console' | 'file' | 'remote'
  file?: {
    path: string
    maxSize: string
    maxFiles: number
  }
  remote?: {
    url: string
    apiKey?: string
  }
  context?: Record<string, unknown>
}

// Monitoring Adapter Interfaces
export interface IMonitoringAdapter extends IAdapter<MonitoringAdapterConfig> {
  incrementCounter(name: string, value?: number, tags?: Record<string, string>): void
  recordGauge(name: string, value: number, tags?: Record<string, string>): void
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void
  setHealth(status: 'healthy' | 'unhealthy' | 'degraded', message?: string): void
  trackError(error: Error, context?: Record<string, unknown>): void
}

export interface MonitoringAdapterConfig {
  type: 'prometheus' | 'datadog' | 'newrelic' | 'custom'
  endpoint?: string
  apiKey?: string
  serviceName: string
  environment: string
  version: string
  defaultTags?: Record<string, string>
}

// Specific Service Adapters
export interface IJagexApiAdapter extends IApiAdapter {
  fetchItemPrice(itemId: number): Promise<number | null>
  fetchBulkPrices(itemIds: number[]): Promise<Map<number, number>>
}

export interface IWikiApiAdapter extends IApiAdapter {
  fetchLatestData(): Promise<Record<string, MarketData>>
  fetchVolumeData(): Promise<Record<string, VolumeData>>
  fetchMappingData(): Promise<Item[]>
}

export interface IBlobStorageAdapter extends IStorageAdapter {
  uploadDeathCofferData(data: DeathCofferItem[], date: string): Promise<string>
  downloadDeathCofferData(date: string): Promise<DeathCofferItem[]>
  listDeathCofferData(): Promise<Array<{
    date: string
    itemCount: number
    uploadedAt: string
  }>>
}

// Adapter Factory Interface
export interface IAdapterFactory {
  createApiAdapter(config: ApiAdapterConfig): IApiAdapter
  createCacheAdapter(config: CacheAdapterConfig): ICacheAdapter
  createStorageAdapter(config: StorageAdapterConfig): IStorageAdapter
  createDatabaseAdapter(config: DatabaseAdapterConfig): IDatabaseAdapter
  createEventAdapter(config: EventAdapterConfig): IEventAdapter
  createLoggingAdapter(config: LoggingAdapterConfig): ILoggingAdapter
  createMonitoringAdapter(config: MonitoringAdapterConfig): IMonitoringAdapter
  createJagexApiAdapter(config: ApiAdapterConfig): IJagexApiAdapter
  createWikiApiAdapter(config: ApiAdapterConfig): IWikiApiAdapter
  createBlobStorageAdapter(config: StorageAdapterConfig): IBlobStorageAdapter
}

// Adapter Registry
export interface IAdapterRegistry {
  register<T extends IAdapter>(name: string, adapter: T): void
  get<T extends IAdapter>(name: string): T | null
  unregister(name: string): boolean
  list(): string[]
  clear(): void
}

// Adapter Health Check
export interface AdapterHealth {
  name: string
  type: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  lastCheck: string
  responseTime?: number
  error?: string
  metadata?: Record<string, unknown>
}

export interface IAdapterHealthChecker {
  checkAdapter(name: string): Promise<AdapterHealth>
  checkAllAdapters(): Promise<AdapterHealth[]>
  registerHealthCheck(name: string, checkFn: () => Promise<boolean>): void
}
