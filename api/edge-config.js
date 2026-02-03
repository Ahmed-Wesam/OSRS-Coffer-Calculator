import { addSecurityHeaders, sanitizeInput, validateIP, createRateLimiter } from '../src/lib/security.js'

// Create rate limiters
const dataRateLimiter = createRateLimiter(10, 60000) // 10 requests per minute
const cronRateLimiter = createRateLimiter(2, 300000) // 2 requests per 5 minutes

export default async function handler(request, response) {
  try {
    // Add security headers
    addSecurityHeaders(response)
    
    // Validate request method
    if (request.method !== 'GET') {
      return response.status(405).json({ error: 'Method not allowed' })
    }
    
    // Get and validate client IP
    const clientIP = sanitizeInput(
      request.headers['x-forwarded-for'] || 
      request.headers['x-real-ip'] || 
      request.connection?.remoteAddress || 
      'unknown'
    )
    
    // Validate IP format
    if (!validateIP(clientIP)) {
      return response.status(403).json({ 
        error: 'Access denied',
        message: 'Invalid IP address'
      })
    }
    
    // Apply rate limiting
    if (!dataRateLimiter(clientIP)) {
      return response.status(429).json({ 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      })
    }
    
    // Fetch data from Vercel Blob Storage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId);

    if (!blobResponse.ok) {
      return response.status(404).json({ error: 'Blob data not found' })
    }

    const blobData = await blobResponse.json()
    
    // Find all items-*.json files (timestamped files) - standardize on items-* format
    const itemsBlobs = blobData.blobs.filter(blob => 
      blob.pathname.startsWith('items-') && blob.pathname.endsWith('.json')
    )
    
    if (itemsBlobs.length === 0) {
      return response.status(404).json({ error: 'No items data found' })
    }

    // Sort by date (newest first)
    itemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadAt))
    
    // Get the last 2 days of data only
    const recentBlobs = itemsBlobs.slice(0, 2)
    
    // Fetch all recent files in parallel with timeout
    const contentPromises = recentBlobs.map(async (blob) => {
      const contentController = new AbortController();
      const contentTimeoutId = setTimeout(() => contentController.abort(), 10000); // 10 second timeout per file
      
      try {
        const contentResponse = await fetch(blob.url, {
          signal: contentController.signal
        })
        
        clearTimeout(contentTimeoutId);
        
        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch ${blob.pathname}`)
        }
        const contentText = await contentResponse.text()
        return JSON.parse(contentText)
      } catch (error) {
        clearTimeout(contentTimeoutId);
        throw error;
      }
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
    
    // Remove duplicates by ID (keep latest data) - prioritize timestamp over ROI
    const uniqueItems = new Map()
    let duplicateCount = 0
    
    for (const item of allItems) {
      const existingItem = uniqueItems.get(item.id)
      
      // Validate item structure
      if (!item || typeof item !== 'object') {
        console.warn(`Invalid item structure, skipping: ${JSON.stringify(item)}`)
        continue
      }
      
      if (!item.id || typeof item.id !== 'number') {
        console.warn(`Invalid item ID, skipping: ${JSON.stringify(item)}`)
        continue
      }
      
      // Keep the item if:
      // 1. No existing item with this ID
      // 2. New item has a more recent processedAt timestamp (prioritize over ROI)
      // 3. If timestamps are equal, keep the one with higher ROI
      if (!existingItem || 
          new Date(item.processedAt) > new Date(existingItem.processedAt) ||
          (new Date(item.processedAt).getTime() === new Date(existingItem.processedAt).getTime() && item.roi > existingItem.roi)) {
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
    
    // Sanitize error message to remove sensitive information
    let errorMessage = 'Failed to fetch blob data'
    if (error instanceof Error) {
      // Remove any sensitive data from error message
      errorMessage = error.message
        .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
        .replace(/token\s*=\s*\S+/gi, 'token=[REDACTED]')
        .replace(/password\s*=\s*\S+/gi, 'password=[REDACTED]')
        .replace(/key\s*=\s*\S+/gi, 'key=[REDACTED]')
        .replace(/secret\s*=\s*\S+/gi, 'secret=[REDACTED]')
        .replace(/auth\s*=\s*\S+/gi, 'auth=[REDACTED]')
        .replace(/\b\d{10,}\b/g, '[ID]')
        .replace(/[a-f0-9]{32,}/gi, '[HASH]')
    }
    
    return response.status(500).json({
      error: errorMessage,
      message: 'An error occurred while fetching data'
    })
  } finally {
    // Ensure cleanup
    if (typeof timeoutId !== 'undefined') {
      clearTimeout(timeoutId)
    }
  }
}
