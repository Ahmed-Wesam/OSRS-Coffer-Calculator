export interface Item {
  id: number
  name: string
  examine?: string
  members: boolean
  lowalch?: number
  highalch?: number
  value: number
  limit?: number
  icon?: string
}

export interface DeathCofferItem extends Item {
  buyPrice: number
  officialGePrice: number
  cofferValue: number
  roi: number
  volume: number
  lastUpdated: string
}

export interface Price {
  amount: number
  currency: string
  timestamp: string
  
  isValid(): boolean
  format(): string
}

export interface ROI {
  percentage: number
  absolute: number
  calculatedAt: string
  
  isValid(): boolean
  format(): string
}

export interface Timestamp {
  iso: string
  unix: number
  timezone: string
  
  // Validation methods  
  isValid(): boolean
  toLocal(): string
}

// Market Data
export interface MarketData {
  high: number
  low: number
  highTime: number
  lowTime: number
}

export interface VolumeData {
  avgHighPrice: number
  avgLowPrice: number
  highPriceVolume: number
  lowPriceVolume: number
}

// Data Sources
export interface DataSource {
  name: string
  url: string
  lastSync: string
  status: 'active' | 'inactive' | 'error'
}

export interface DataSnapshot {
  id: string
  timestamp: string
  date: string
  source: string
  itemCount: number
  isFallback?: boolean
  fallbackDate?: string
}

// Filtering and Sorting
export interface FilterCriteria {
  minRoi?: number
  maxRoi?: number
  minBuyPrice?: number
  maxBuyPrice?: number
  minVolume?: number
  itemTypes?: string[]
  membersOnly?: boolean
}

export interface SortCriteria {
  field: keyof DeathCofferItem
  direction: 'asc' | 'desc'
}

export interface SearchCriteria extends FilterCriteria {
  query?: string
  sort?: SortCriteria
  pagination?: {
    page: number
    limit: number
  }
}

// Business Rules
export interface EligibilityRule {
  id: string
  name: string
  description: string
  condition: (item: Item) => boolean
  enabled: boolean
}

export interface CalculationRule {
  id: string
  name: string
  description: string
  formula: (item: Item, marketData: MarketData) => number
  enabled: boolean
}

// Events
export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  payload: unknown
  timestamp: string
  version: number
}

export interface DataUpdatedEvent extends DomainEvent {
  type: 'data.updated'
  payload: {
    itemCount: number
    dataSource: string
    timestamp: string
  }
}

export interface ItemProcessedEvent extends DomainEvent {
  type: 'item.processed'
  payload: {
    itemId: number
    roi: number
    processingTime: number
  }
}
