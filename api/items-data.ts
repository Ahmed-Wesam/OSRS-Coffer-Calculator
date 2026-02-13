import { list } from '@vercel/blob'

export const config = { maxDuration: 300 }

// Define types inline to avoid import issues
interface DeathCofferRow {
  id: number
  name: string
  buyPrice: number
  officialGePrice: number
  cofferValue: number
  roi: number
  lowPriceVolume: number
}

interface BlobStorageResponse {
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

// Transform blob data to expected format
function transformBlobData(blobItems: unknown[]): DeathCofferRow[] {
  return blobItems.map((item: unknown) => {
    const blobItem = item as Record<string, unknown>;
    return {
      id: Number(blobItem.id) || 0,
      name: String(blobItem.name || ''),
      buyPrice: Number(blobItem.offerPrice || blobItem.buyPrice) || 0,
      officialGePrice: Number(blobItem.gePrice || blobItem.officialGePrice) || 0,
      cofferValue: Number(blobItem.cofferValue) || 0,
      roi: Number(blobItem.roi) || 0,
      lowPriceVolume: Number(blobItem.lowPriceVolume) || 0
    };
  });
}

export default async function handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any
): Promise<void> {
  try {
    // Validate request method
    if (request.method !== 'GET') {
      response.status(405).json({ error: 'Method not allowed' })
      return
    }

    // Add CORS headers manually
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      response.status(200).end()
      return
    }

    // Check if environment variables are set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not set')
      response.status(500).json({ error: 'Server configuration error' })
      return
    }

    console.log('🔧 Fetching items data from Vercel Blob Storage...')
    
    // List blobs from Vercel Blob Storage
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN
    })
    
    console.log(`📊 Found ${blobs?.length || 0} blobs in storage`)
    
    const today = new Date().toISOString().split('T')[0]
    
    const itemsBlobs = blobs.filter((blob: { pathname: string; uploadedAt: Date }) => 
      (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
      blob.pathname.endsWith('.json') &&
      blob.pathname.includes(today)
    )
    
    let targetDate = today
    if (itemsBlobs.length === 0) {
      console.log(`⚠️  No items files found for today (${today}), searching for latest available day...`)
      
      const allItemsBlobs = blobs.filter((blob: { pathname: string; uploadedAt: Date }) => 
        (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
        blob.pathname.endsWith('.json')
      )
      
      if (allItemsBlobs.length === 0) {
        console.error('❌ No items files found in blob storage at all')
        response.status(404).json({ error: 'No data available - cron job may not have run yet' })
        return
      }
      
      allItemsBlobs.sort((a: { uploadedAt: Date }, b: { uploadedAt: Date }) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      
      const latestBlob = allItemsBlobs[0]
      const dateMatch = latestBlob.pathname.match(/(\d{4}-\d{2}-\d{2})/)
      targetDate = dateMatch ? dateMatch[1] : today
      
      console.log(`📅 Using fallback date: ${targetDate} (from file: ${latestBlob.pathname})`)
      
      const fallbackBlobs = allItemsBlobs.filter((blob: { pathname: string }) => blob.pathname.includes(targetDate))
      itemsBlobs.push(...fallbackBlobs)
    }
    
    console.log(`📋 Processing ${itemsBlobs.length} items files for ${targetDate}`)
    
    if (itemsBlobs.length === 0) {
      console.error('❌ No items files found after fallback logic')
      response.status(404).json({ error: 'No data available' })
      return
    }
    
    // Fetch and merge data from all relevant blobs
    const allItems: DeathCofferRow[] = []
    const processedFiles: string[] = []
    
    for (const blob of itemsBlobs) {
      try {
        const fileResponse = await fetch(blob.url)
        
        if (!fileResponse.ok) {
          console.log(`⚠️ Failed to fetch ${blob.pathname}: ${fileResponse.status}`)
          continue
        }
        
        const fileData = await fileResponse.json()
        
        if (Array.isArray(fileData)) {
          allItems.push(...fileData)
          processedFiles.push(blob.pathname)
        } else if (fileData.items && Array.isArray(fileData.items)) {
          allItems.push(...fileData.items)
          processedFiles.push(blob.pathname)
        } else {
          console.log(`⚠️ Invalid data format in ${blob.pathname}`)
        }
      } catch (error) {
        console.error(`❌ Error processing ${blob.pathname}:`, error)
      }
    }
    
    if (allItems.length === 0) {
      console.error('❌ No valid items data found in any files')
      response.status(404).json({ error: 'No valid data available' })
      return
    }
    
    // Deduplicate items by ID
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((i) => i.id === item.id)
    )
    
    console.log(`📊 Total items: ${allItems.length}, Unique items: ${uniqueItems.length}`)
    
    // Sort by ROI descending
    uniqueItems.sort((a, b) => (b.roi || 0) - (a.roi || 0))
    
    // Transform data to match frontend expectations
    const transformedItems = transformBlobData(uniqueItems)
    
    // Get the actual file timestamp instead of current time
    const fileTimestamp = itemsBlobs.length > 0 ? itemsBlobs[0].uploadedAt.toISOString() : new Date().toISOString()
    
    const responseData: BlobStorageResponse = {
      timestamp: fileTimestamp,
      date: targetDate,
      isFallback: targetDate !== today,
      sourceFiles: processedFiles.map((filename: string) => ({
        filename,
        timestamp: fileTimestamp,
        itemCount: 0 // Would need to fetch file to get accurate count
      })),
      totalItems: transformedItems.length,
      items: transformedItems
    }
    
    console.log(`🚀 Successfully returning ${uniqueItems.length} items`)
    
    response.status(200).json(responseData)
    
  } catch (error) {
    console.error('❌ Error in items-data handler:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Failed to read blob data')) {
      response.status(500).json({ 
        error: 'Failed to read items data',
        code: 'BLOB_READ_ERROR',
        timestamp: new Date().toISOString()
      })
    } else {
      response.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      })
    }
  }
}
