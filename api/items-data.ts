import type { BlobStorageResponse } from '../src/lib/types'
import { addSecurityHeaders } from '../src/lib/security'

export const config = { maxDuration: 300 }

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

    // Add security headers
    addSecurityHeaders(response)

    // Check if environment variables are set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not set')
      response.status(500).json({ error: 'Server configuration error' })
      return
    }

    console.log('🔧 Fetching items data from Vercel Blob Storage...')
    
    // Read from Blob Storage
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!blobResponse.ok) {
      console.error(`❌ Blob API failed: ${blobResponse.status} ${blobResponse.statusText}`)
      response.status(404).json({ error: 'No items data available' })
      return
    }
    
    const blobData = await blobResponse.json()
    console.log(`📊 Found ${blobData.blobs?.length || 0} blobs in storage`)
    
    const today = new Date().toISOString().split('T')[0]
    
    const itemsBlobs = blobData.blobs.filter((blob: {pathname: string, uploadedAt: string}) => 
      (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
      blob.pathname.endsWith('.json') &&
      blob.pathname.includes(today)
    )
    
    let targetDate = today
    if (itemsBlobs.length === 0) {
      console.log(`⚠️  No items files found for today (${today}), searching for latest available day...`)
      
      const allItemsBlobs = blobData.blobs.filter((blob: {pathname: string, uploadedAt: string}) => 
        (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
        blob.pathname.endsWith('.json')
      )
      
      if (allItemsBlobs.length === 0) {
        console.error('❌ No items files found in blob storage at all')
        response.status(404).json({ error: 'No data available - cron job may not have run yet' })
        return
      }
      
      allItemsBlobs.sort((a: {uploadedAt: string}, b: {uploadedAt: string}) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      
      const latestBlob = allItemsBlobs[0]
      const dateMatch = latestBlob.pathname.match(/(\d{4}-\d{2}-\d{2})/)
      targetDate = dateMatch ? dateMatch[1] : today
      
      console.log(`📅 Using fallback date: ${targetDate} (from file: ${latestBlob.pathname})`)
      
      const fallbackBlobs = allItemsBlobs.filter((blob: {pathname: string}) => blob.pathname.includes(targetDate))
      itemsBlobs.push(...fallbackBlobs)
    }
    
    if (itemsBlobs.length === 0) {
      response.status(404).json({ error: `No items files found for today (${today}) or fallback date` })
      return
    }
    
    itemsBlobs.sort((a: {uploadedAt: string}, b: {uploadedAt: string}) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    
    const allItems: unknown[] = []
    const fileTimestamps: Array<{filename: string, timestamp: string, itemCount: number}> = []
    
    console.log(`📁 Found ${itemsBlobs.length} files for ${targetDate === today ? 'today' : `fallback date ${targetDate}`}, fetching all...`)
    
    for (const blob of itemsBlobs) {
      try {
        const contentResponse = await fetch(blob.url)
        const data = await contentResponse.json()
        
        if (data.items && Array.isArray(data.items)) {
          allItems.push(...data.items)
          fileTimestamps.push({
            filename: blob.pathname,
            timestamp: (data as {timestamp?: string}).timestamp || blob.uploadedAt,
            itemCount: data.items.length
          })
          console.log(`📄 Loaded ${blob.pathname}: ${data.items.length} items`)
        }
      } catch {
        console.error(`❌ Failed to load ${blob.pathname}`)
      }
    }
    
    const uniqueItems: BlobStorageResponse['items'] = []
    const seenIds = new Set()
    
    for (const item of allItems) {
      if (!seenIds.has((item as {id: number}).id)) {
        seenIds.add((item as {id: number}).id)
        uniqueItems.push(item as BlobStorageResponse['items'][0])
      }
    }
    
    console.log(`📊 Total items from ${targetDate === today ? "today's" : "fallback date's"} files: ${allItems.length}`)
    console.log(`📊 Unique items after deduplication: ${uniqueItems.length}`)
    
    response.status(200).json({
      items: uniqueItems,
      date: targetDate,
      timestamp: new Date().toISOString(),
      isFallback: targetDate !== today,
      fallbackDate: targetDate !== today ? targetDate : undefined,
      sourceFiles: itemsBlobs.map((blob: {pathname: string, uploadedAt: string}) => ({
        filename: blob.pathname,
        timestamp: blob.uploadedAt,
        itemCount: 0
      })),
      totalItems: uniqueItems.length
    })
    
  } catch (error) {
    console.error('❌ Error in items-data handler:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Failed to read blob data')) {
      response.status(500).json({ 
        error: 'Failed to read items data',
        code: 'BLOB_READ_ERROR',
        timestamp: new Date().toISOString()
      })
    } else if (errorMessage.includes('HTTP')) {
      response.status(500).json({ 
        error: 'External service error',
        code: 'EXTERNAL_SERVICE_ERROR',
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
