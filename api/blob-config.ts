import type { BlobStorageResponse } from '../src/lib/types'

export default async function handler(
  request: any, 
  response: any
): Promise<void> {
  try {
    // Check if environment variables are set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not set')
      response.status(500).json({ error: 'Server configuration error' })
      return
    }

    console.log('🔧 Fetching blob data from Vercel API...')
    
    // Read from Blob Storage
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!blobResponse.ok) {
      console.error(`❌ Blob API failed: ${blobResponse.status} ${blobResponse.statusText}`)
      response.status(404).json({ error: 'No blob data available' })
      return
    }
    
    const blobData = await blobResponse.json()
    console.log(`📊 Found ${blobData.blobs?.length || 0} blobs in storage`)
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    
    // Find items-*.json files with today's date (with or without ob/ prefix)
    const itemsBlobs = blobData.blobs.filter((blob: any) => 
      (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
      blob.pathname.endsWith('.json') &&
      blob.pathname.includes(today)
    )
    
    // If no today's files found, fallback to the latest available day
    let targetDate = today
    if (itemsBlobs.length === 0) {
      console.log(`⚠️  No items files found for today (${today}), searching for latest available day...`)
      
      // Find all items-*.json files and sort by date
      const allItemsBlobs = blobData.blobs.filter((blob: any) => 
        (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
        blob.pathname.endsWith('.json')
      )
      
      if (allItemsBlobs.length === 0) {
        console.error('❌ No items files found in blob storage at all')
        response.status(404).json({ error: 'No data available - cron job may not have run yet' })
        return
      }
      
      // Sort by upload date (newest first)
      allItemsBlobs.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      
      // Extract date from the newest file's pathname
      const latestBlob = allItemsBlobs[0]
      const dateMatch = latestBlob.pathname.match(/(\d{4}-\d{2}-\d{2})/)
      targetDate = dateMatch ? dateMatch[1] : today
      
      console.log(`📅 Using fallback date: ${targetDate} (from file: ${latestBlob.pathname})`)
      
      // Filter files for the fallback date
      const fallbackBlobs = allItemsBlobs.filter((blob: any) => blob.pathname.includes(targetDate))
      itemsBlobs.push(...fallbackBlobs)
    }
    
    if (itemsBlobs.length === 0) {
      response.status(404).json({ error: `No items files found for today (${today}) or fallback date` })
      return
    }
    
    // Sort by date (newest first)
    itemsBlobs.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    
    // Fetch today's files and merge data
    const allItems: any[] = []
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
            timestamp: data.timestamp || blob.uploadedAt,
            itemCount: data.items.length
          })
          console.log(`📄 Loaded ${blob.pathname}: ${data.items.length} items`)
        }
      } catch (error) {
        console.error(`❌ Failed to load ${blob.pathname}:`, (error as Error).message)
      }
    }
    
    // Remove duplicates by item ID (keep latest data)
    const uniqueItems: any[] = []
    const seenIds = new Set()
    
    for (const item of allItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        uniqueItems.push(item)
      }
    }
    
    console.log(`📊 Total items from ${targetDate === today ? "today's" : "fallback date's"} files: ${allItems.length}`)
    console.log(`📊 Unique items after deduplication: ${uniqueItems.length}`)
    
    // Use the latest source file timestamp instead of current time
    const latestTimestamp = fileTimestamps.length > 0 
      ? fileTimestamps[0].timestamp 
      : new Date().toISOString()
    
    const mergedData: BlobStorageResponse = {
      timestamp: latestTimestamp,
      date: targetDate,
      isFallback: targetDate !== today,
      fallbackDate: targetDate !== today ? targetDate : undefined,
      sourceFiles: fileTimestamps,
      totalItems: uniqueItems.length,
      items: uniqueItems
    }
    
    response.status(200).json(mergedData)
    
  } catch (error) {
    response.status(500).json({ error: 'Failed to read blob data' })
  }
}
