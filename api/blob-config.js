export default async function handler(request, response) {
  try {
    // Read from Blob Storage
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!blobResponse.ok) {
      return response.status(404).json({ error: 'No blob data' })
    }
    
    const blobData = await blobResponse.json()
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    
    // Find items-*.json files with today's date (with or without ob/ prefix)
    const itemsBlobs = blobData.blobs.filter(blob => 
      (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
      blob.pathname.endsWith('.json') &&
      blob.pathname.includes(today)
    )
    
    // If no today's files found, fallback to the latest available day
    let targetDate = today
    if (itemsBlobs.length === 0) {
      console.log(`⚠️  No items files found for today (${today}), searching for latest available day...`)
      
      // Find all items-*.json files and sort by date
      const allItemsBlobs = blobData.blobs.filter(blob => 
        (blob.pathname.startsWith('items-') || blob.pathname.startsWith('ob/items-')) && 
        blob.pathname.endsWith('.json')
      )
      
      if (allItemsBlobs.length === 0) {
        return response.status(404).json({ error: 'No items files found in storage' })
      }
      
      // Sort by upload date (newest first)
      allItemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      
      // Extract date from the newest file's pathname
      const latestBlob = allItemsBlobs[0]
      const dateMatch = latestBlob.pathname.match(/(\d{4}-\d{2}-\d{2})/)
      targetDate = dateMatch ? dateMatch[1] : today
      
      console.log(`📅 Using fallback date: ${targetDate} (from file: ${latestBlob.pathname})`)
      
      // Filter files for the fallback date
      const fallbackBlobs = allItemsBlobs.filter(blob => blob.pathname.includes(targetDate))
      itemsBlobs.push(...fallbackBlobs)
    }
    
    if (itemsBlobs.length === 0) {
      return response.status(404).json({ error: `No items files found for today (${today}) or fallback date` })
    }
    
    // Sort by date (newest first)
    itemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    
    // Fetch today's files and merge data
    const allItems = []
    const fileTimestamps = []
    
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
        console.error(`❌ Failed to load ${blob.pathname}:`, error.message)
      }
    }
    
    // Remove duplicates by item ID (keep latest data)
    const uniqueItems = []
    const seenIds = new Set()
    
    for (const item of allItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        uniqueItems.push(item)
      }
    }
    
    console.log(`📊 Total items from ${targetDate === today ? "today's" : "fallback date's"} files: ${allItems.length}`)
    console.log(`📊 Unique items after deduplication: ${uniqueItems.length}`)
    
    const mergedData = {
      timestamp: new Date().toISOString(),
      date: targetDate,
      isFallback: targetDate !== today,
      fallbackDate: targetDate !== today ? targetDate : undefined,
      sourceFiles: fileTimestamps,
      totalItems: uniqueItems.length,
      items: uniqueItems
    }
    
    return response.status(200).json(mergedData)
    
  } catch (error) {
    return response.status(500).json({ error: 'Failed to read blob data' })
  }
}
