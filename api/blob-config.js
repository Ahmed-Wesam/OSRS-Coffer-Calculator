// Simple working version without complex security imports
export default async function handler(request, response) {
  try {
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return response.status(200).end()
    }
    
    // Validate request method
    if (request.method !== 'GET') {
      return response.status(405).json({ error: 'Method not allowed' })
    }
    
    console.log('📊 Fetching Blob Storage data...')
    
    // Fetch data from Vercel Blob Storage
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    })
    
    if (!blobResponse.ok) {
      console.error('❌ Failed to fetch blob list:', blobResponse.status, blobResponse.statusText)
      return response.status(404).json({ 
        error: 'Blob data not found',
        message: 'No data available yet. Run the cron job first.'
      })
    }

    const blobData = await blobResponse.json()
    console.log(`📁 Found ${blobData.blobs.length} total blobs`)
    
    // Find items-*.json files (timestamped files)
    const itemsBlobs = blobData.blobs.filter(blob => 
      blob.pathname.startsWith('items-') && blob.pathname.endsWith('.json')
    )
    
    if (itemsBlobs.length === 0) {
      console.log('❌ No items-*.json files found')
      return response.status(404).json({ 
        error: 'No items data found',
        message: 'No processed data available. Run the cron job to generate data.'
      })
    }

    console.log(`📊 Found ${itemsBlobs.length} items files`)

    // Sort by date (newest first) and get latest
    itemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    const latestBlob = itemsBlobs[0]
    
    console.log(`📁 Fetching latest file: ${latestBlob.pathname}`)
    
    // Fetch the latest file
    const contentResponse = await fetch(latestBlob.url)
    
    if (!contentResponse.ok) {
      console.error('❌ Failed to fetch blob content:', contentResponse.status)
      return response.status(500).json({ error: 'Failed to fetch data content' })
    }
    
    const contentText = await contentResponse.text()
    const data = JSON.parse(contentText)
    
    console.log(`✅ Successfully loaded data with ${data.items?.length || 0} items`)
    
    // Filter by volume * price ≥ 1m (same as local script)
    const filteredItems = data.items ? data.items.filter(item => 
      item.volume && item.buyPrice && (item.volume * item.buyPrice) >= 1000000
    ) : []
    
    console.log(`📊 Filtered ${data.items?.length || 0} items to ${filteredItems.length} items (volume*price ≥ 1m)`)
    
    const responseData = {
      timestamp: data.timestamp || new Date().toISOString(),
      itemCount: filteredItems.length,
      items: filteredItems,
      sources: [latestBlob.pathname]
    }

    return response.status(200).json(responseData)

  } catch (error) {
    console.error('❌ API Error:', error)
    
    // Return a more helpful error message
    return response.status(500).json({
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}
