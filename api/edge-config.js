export default async function handler(request, response) {
  try {
    // Fetch data from Vercel Blob Storage
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })

    if (!blobResponse.ok) {
      return response.status(404).json({ error: 'Blob data not found' })
    }

    const blobData = await blobResponse.json()
    
    // Find all items-*.json files (timestamped files)
    const itemsBlobs = blobData.blobs.filter(blob => 
      (blob.pathname.startsWith('ob/items-') || blob.pathname.startsWith('items-')) && 
      blob.pathname.endsWith('.json')
    )
    
    if (itemsBlobs.length === 0) {
      return response.status(404).json({ error: 'No items data found' })
    }

    // Sort by date (newest first)
    itemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadAt))
    
    // Get the last 2 days of data only
    const recentBlobs = itemsBlobs.slice(0, 2)
    
    // Fetch all recent files in parallel
    const contentPromises = recentBlobs.map(async (blob) => {
      const contentResponse = await fetch(blob.url)
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch ${blob.pathname}`)
      }
      const contentText = await contentResponse.text()
      return JSON.parse(contentText)
    })
    
    const allData = await Promise.all(contentPromises)
    
    // Merge all items from all files
    const allItems = []
    const latestTimestamp = allData[0]?.timestamp || new Date().toISOString()
    
    console.log(`📊 Merging data from ${allData.length} files...`)
    
    for (const data of allData) {
      if (data.items && Array.isArray(data.items)) {
        console.log(`   📁 Adding ${data.items.length} items from ${data.timestamp}`)
        allItems.push(...data.items)
      }
    }
    
    console.log(`📊 Total items before deduplication: ${allItems.length}`)
    
    // Remove duplicates by ID (keep latest data)
    const uniqueItems = new Map()
    let duplicateCount = 0
    
    for (const item of allItems) {
      const existingItem = uniqueItems.get(item.id)
      
      // Keep the item if:
      // 1. No existing item with this ID
      // 2. New item has a more recent processedAt timestamp
      // 3. New item has a higher ROI (better data)
      if (!existingItem || 
          new Date(item.processedAt) > new Date(existingItem.processedAt) ||
          item.roi > existingItem.roi) {
        uniqueItems.set(item.id, item)
      } else {
        duplicateCount++
      }
    }
    
    console.log(`🗑️ Removed ${duplicateCount} duplicate items`)
    console.log(`✅ Unique items after deduplication: ${uniqueItems.size}`)
    
    // Convert back to array and sort by ROI
    const mergedItems = Array.from(uniqueItems.values())
      .sort((a, b) => b.roi - a.roi)
    
    const mergedData = {
      timestamp: latestTimestamp,
      itemCount: mergedItems.length,
      items: mergedItems,
      sources: recentBlobs.map(blob => blob.pathname)
    }

    return response.status(200).json(mergedData)

  } catch (error) {
    console.error('❌ Failed to fetch blob data:', error)
    return response.status(500).json({
      error: 'Failed to fetch blob data',
      message: error.message
    })
  }
}
