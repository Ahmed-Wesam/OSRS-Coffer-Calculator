// Client-side API functions for Blob Storage
import type { BlobStorageResponse } from './types'

// Use deployed API for both development and production
const API_BASE = '/api'

export async function fetchBlobStorageDeathsCofferRows(): Promise<BlobStorageResponse> {
  try {
    const response = await fetch(`${API_BASE}/blob-config`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch Blob Storage Death\'s Coffer data:', error)
    throw error
  }
}

export async function triggerBlobStorageUpdate(): Promise<{success: boolean, itemCount?: number, timestamp?: string}> {
  try {
    const response = await fetch(`${API_BASE}/update-blob-config`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to trigger Blob Storage update:', error)
    throw error
  }
}

// Deprecated aliases for backward compatibility
export const fetchEdgeConfigDeathsCofferRows = fetchBlobStorageDeathsCofferRows;
export const triggerEdgeConfigUpdate = triggerBlobStorageUpdate;
