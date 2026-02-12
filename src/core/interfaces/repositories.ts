// Repository Pattern Interfaces

import type { DeathCofferItem, Item, DataSnapshot, SearchCriteria, FilterCriteria } from '../types/domain.types'
import type { PaginatedResponse } from '../types/api.types'

// Base Repository Interface with proper constraints
export interface IRepository<T, K = string | number> {
  findById(id: K): Promise<T | null>
  findAll(criteria?: SearchCriteria): Promise<PaginatedResponse<T>>
  save(entity: Omit<T, 'id'>): Promise<T>
  update(id: K, updates: Partial<T>): Promise<T>
  delete(id: K): Promise<boolean>
  count(criteria?: FilterCriteria): Promise<number>
}

// Specific Repository Interfaces
export interface IItemRepository extends IRepository<Item> {
  findByPriceRange(min: number, max: number): Promise<Item[]>
  findByMembersOnly(membersOnly: boolean): Promise<Item[]>
  findByNamePattern(pattern: string): Promise<Item[]>
  findEligibleItems(): Promise<Item[]>
  searchItems(query: string, filters?: FilterCriteria): Promise<PaginatedResponse<Item>>
}

export interface IDeathCofferRepository extends IRepository<DeathCofferItem> {
  findByRoiRange(min: number, max: number): Promise<DeathCofferItem[]>
  findByVolumeRange(min: number, max: number): Promise<DeathCofferItem[]>
  findProfitableItems(): Promise<DeathCofferItem[]>
  findTopItemsByRoi(limit: number): Promise<DeathCofferItem[]>
  searchDeathCofferItems(criteria: SearchCriteria): Promise<PaginatedResponse<DeathCofferItem>>
  calculateStats(items?: DeathCofferItem[]): Promise<{
    totalItems: number
    avgRoi: number
    avgVolume: number
    totalVolume: number
  }>
}

export interface IDataSnapshotRepository extends IRepository<DataSnapshot, string> {
  findLatest(): Promise<DataSnapshot | null>
  findByDate(date: string): Promise<DataSnapshot | null>
  findDateRange(startDate: string, endDate: string): Promise<DataSnapshot[]>
  findFallbacks(): Promise<DataSnapshot[]>
  cleanupOldSnapshots(olderThanDays: number): Promise<number>
}

// Cache Repository Interface
export interface ICacheRepository<T> {
  get(key: string): Promise<T | null>
  set(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  exists(key: string): Promise<boolean>
  keys(pattern?: string): Promise<string[]>
  ttl(key: string): Promise<number>
}

// Query Builder Interface
export interface IQueryBuilder<T> {
  select(fields?: (keyof T)[]): IQuerySelector<T>
  where(condition: (item: T) => boolean): IQueryBuilder<T>
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): IQueryBuilder<T>
  limit(count: number): IQueryBuilder<T>
  offset(count: number): IQueryBuilder<T>
  execute(): Promise<T[]>
  count(): Promise<number>
  first(): Promise<T | null>
}

export interface IQuerySelector<T> {
  where(condition: (item: T) => boolean): IQueryBuilder<T>
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): IQueryBuilder<T>
  limit(count: number): IQueryBuilder<T>
  offset(count: number): IQueryBuilder<T>
  execute(): Promise<T[]>
  count(): Promise<number>
  first(): Promise<T | null>
}

// Repository Factory Interface
export interface IRepositoryFactory {
  getItemRepository(): IItemRepository
  getDeathCofferRepository(): IDeathCofferRepository
  getDataSnapshotRepository(): IDataSnapshotRepository
  getCacheRepository<T>(): ICacheRepository<T>
  createQueryBuilder<T>(): IQueryBuilder<T>
}

// Repository Configuration
export interface RepositoryConfig {
  type: 'memory' | 'file' | 'database' | 'api'
  connection?: string
  options?: Record<string, unknown>
  cache?: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  retry?: {
    maxAttempts: number
    baseDelay: number
    maxDelay: number
  }
}

// Repository Events
export interface RepositoryEvent<T> {
  type: 'created' | 'updated' | 'deleted' | 'queried'
  entity: T
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface IRepositoryEventEmitter<T> {
  on(event: RepositoryEvent<T>['type'], listener: (event: RepositoryEvent<T>) => void): void
  off(event: RepositoryEvent<T>['type'], listener: (event: RepositoryEvent<T>) => void): void
  emit(event: RepositoryEvent<T>): void
}

// Transaction Interface
export interface ITransaction {
  id: string
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  isActive(): boolean
}

export interface ITransactionalRepository<T, K = string | number> extends IRepository<T, K> {
  withTransaction<TResult>(
    operation: (transaction: ITransaction) => Promise<TResult>
  ): Promise<TResult>
}
