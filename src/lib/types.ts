export type OsrsMappingItem = {
  examine?: string
  id: number
  members: boolean
  lowalch?: number
  limit?: number
  value?: number
  highalch?: number
  icon?: string
  name: string
}

export type OsrsLatestDatum = {
  high: number
  highTime: number
  low: number
  lowTime: number
}

export type OsrsVolumeDatum = {
  avgHighPrice: number
  avgLowPrice: number
  highPriceVolume: number
  lowPriceVolume: number
}

export type OsrsVolumeResponse = {
  data: Record<string, OsrsVolumeDatum>
}

export type OsrsLatestResponse = {
  data: Record<string, OsrsLatestDatum>
}

export type DeathCofferRow = {
  id: number
  name: string
  buyPrice: number
  officialGePrice: number
  cofferValue: number
  roi: number
  volume: number
}

export type BlobStorageResponse = {
  timestamp: string
  date: string
  isFallback?: boolean
  fallbackDate?: string
  sourceFiles: Array<{
    filename: string
    timestamp: string
    itemCount: number
  }>
  totalItems: number
  items: DeathCofferRow[]
}
