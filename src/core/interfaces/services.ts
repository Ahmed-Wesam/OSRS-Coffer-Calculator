// Service Layer Interfaces

import type { DeathCofferItem, Item, MarketData, VolumeData, ROI, FilterCriteria, SortCriteria } from '../types/domain.types'
import type { PaginatedResponse } from '../types/api.types'

// Base Service Interface
export interface IService {
  initialize(): Promise<void>
  healthCheck(): Promise<boolean>
  shutdown(): Promise<void>
}

// Data Service Interfaces
export interface IItemService extends IService {
  getItem(id: number): Promise<Item | null>
  getItems(criteria?: FilterCriteria & SortCriteria): Promise<PaginatedResponse<Item>>
  searchItems(query: string, filters?: FilterCriteria): Promise<PaginatedResponse<Item>>
  getEligibleItems(): Promise<Item[]>
  validateItem(item: Item): Promise<boolean>
}

export interface IDeathCofferService extends IService {
  calculateROI(item: Item, marketData: MarketData): ROI
  getDeathCofferItems(criteria?: FilterCriteria & SortCriteria): Promise<PaginatedResponse<DeathCofferItem>>
  getProfitableItems(minRoi?: number): Promise<DeathCofferItem[]>
  getTopItemsByRoi(limit?: number): Promise<DeathCofferItem[]>
  searchDeathCofferItems(query: string, filters?: FilterCriteria): Promise<PaginatedResponse<DeathCofferItem>>
  refreshData(): Promise<void>
  getDataInfo(): Promise<{
    lastUpdated: string
    itemCount: number
    source: string
    isFallback: boolean
  }>
}

export interface IMarketDataService extends IService {
  getMarketData(itemId: number): Promise<MarketData | null>
  getVolumeData(itemId: number): Promise<VolumeData | null>
  getBulkMarketData(itemIds: number[]): Promise<Map<number, MarketData>>
  getBulkVolumeData(itemIds: number[]): Promise<Map<number, VolumeData>>
  refreshMarketData(itemIds?: number[]): Promise<void>
  validateMarketData(data: MarketData): boolean
}

// Calculation Service Interfaces
export interface IROICalculationService extends IService {
  calculateROI(item: Item, marketData: MarketData): ROI
  calculateBulkROI(items: Item[], marketData: Map<number, MarketData>): Map<number, ROI>
  validateROI(roi: ROI): boolean
  getROIStats(roiData: ROI[]): {
    average: number
    median: number
    min: number
    max: number
    standardDeviation: number
  }
}

export interface IFilteringService extends IService {
  filterByCriteria(items: DeathCofferItem[], criteria: FilterCriteria): DeathCofferItem[]
  sortByCriteria(items: DeathCofferItem[], criteria: SortCriteria): DeathCofferItem[]
  searchItems(items: DeathCofferItem[], query: string): DeathCofferItem[]
  paginateItems(items: DeathCofferItem[], page: number, limit: number): PaginatedResponse<DeathCofferItem>
}

// External Service Interfaces
export interface IJagexApiService extends IService {
  fetchItemPrice(itemId: number): Promise<number | null>
  fetchBulkPrices(itemIds: number[]): Promise<Map<number, number>>
  validatePrice(price: number): boolean
}

export interface IWikiApiService extends IService {
  fetchLatestData(): Promise<Record<string, MarketData>>
  fetchVolumeData(): Promise<Record<string, VolumeData>>
  fetchMappingData(): Promise<Item[]>
  validateApiResponse(data: unknown): boolean
}

export interface IBlobStorageService extends IService {
  uploadData(data: unknown, path: string): Promise<string>
  downloadData(path: string): Promise<unknown>
  listFiles(prefix?: string): Promise<Array<{
    pathname: string
    uploadedAt: string
    size: number
  }>>
  deleteFile(path: string): Promise<boolean>
  fileExists(path: string): Promise<boolean>
}

// Scraping Service Interface
export interface IScrapingService extends IService {
  scrapeAllData(): Promise<{
    items: DeathCofferItem[]
    timestamp: string
    source: string
  }>
  scrapeMarketData(): Promise<Map<number, MarketData>>
  scrapeVolumeData(): Promise<Map<number, VolumeData>>
  scrapeMappingData(): Promise<Item[]>
  validateScrapedData(data: unknown): boolean
}

// Cache Service Interface
export interface ICacheService extends IService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  exists(key: string): Promise<boolean>
  getKeys(pattern?: string): Promise<string[]>
  getTtl(key: string): Promise<number>
  setTtl(key: string, ttl: number): Promise<void>
}

// Notification Service Interface
export interface INotificationService extends IService {
  sendNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): Promise<void>
  sendErrorNotification(error: Error, context?: string): Promise<void>
  sendSuccessNotification(message: string): Promise<void>
  sendWarningNotification(message: string): Promise<void>
}

// Configuration Service Interface
export interface IConfigurationService extends IService {
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: unknown): Promise<void>
  getAll(): Record<string, unknown>
  refresh(): Promise<void>
  validate(): boolean
}

// Logging Service Interface
export interface ILoggingService extends IService {
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, error?: Error, data?: unknown): void
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void
}

// Service Factory Interface
export interface IServiceFactory {
  getItemService(): IItemService
  getDeathCofferService(): IDeathCofferService
  getMarketDataService(): IMarketDataService
  getROICalculationService(): IROICalculationService
  getFilteringService(): IFilteringService
  getJagexApiService(): IJagexApiService
  getWikiApiService(): IWikiApiService
  getBlobStorageService(): IBlobStorageService
  getScrapingService(): IScrapingService
  getCacheService(): ICacheService
  getNotificationService(): INotificationService
  getConfigurationService(): IConfigurationService
  getLoggingService(): ILoggingService
}

// Service Configuration
export interface ServiceConfig {
  name: string
  enabled: boolean
  timeout?: number
  retries?: number
  cache?: {
    enabled: boolean
    ttl: number
  }
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
}

// Service Health
export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  lastCheck: string
  responseTime?: number
  error?: string
  metadata?: Record<string, unknown>
}

export interface IHealthCheckService extends IService {
  checkAllServices(): Promise<ServiceHealth[]>
  checkService(serviceName: string): Promise<ServiceHealth>
  registerHealthCheck(serviceName: string, checkFn: () => Promise<boolean>): void
}

// Service Events
export interface ServiceEvent {
  type: 'started' | 'stopped' | 'error' | 'health-check'
  serviceName: string
  timestamp: string
  data?: unknown
}

export interface IServiceEventEmitter {
  on(event: ServiceEvent['type'], listener: (event: ServiceEvent) => void): void
  off(event: ServiceEvent['type'], listener: (event: ServiceEvent) => void): void
  emit(event: ServiceEvent): void
}
