import type { BlobStorageResponse } from './types'
import { mockBlobStorageResponse } from './mockData'

const API_BASE = '/api'
const isDevelopment = import.meta.env.DEV

export async function fetchBlobStorageDeathsCofferRows(): Promise<BlobStorageResponse> {
  if (isDevelopment) {
    console.log('🔧 Using mock data for development')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('🔧 Mock data loaded:', mockBlobStorageResponse)
    return mockBlobStorageResponse
  }

  try {
    const response = await fetch(`${API_BASE}/items-data`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format: Expected JSON')
    }

    const data = await response.json()
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Expected object')
    }

    if (!Array.isArray(data.items)) {
      throw new Error('Invalid response format: Expected items array')
    }

    if (!data.date || typeof data.date !== 'string') {
      throw new Error('Invalid response format: Expected date string')
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
      throw new Error('Invalid response format: Expected timestamp string')
    }

    return data as BlobStorageResponse
    
  } catch (error) {
    console.error('Failed to fetch Blob Storage Death\'s Coffer data:', error)
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Death's Coffer data: ${error.message}`)
    }
    
    throw error
  }
}
