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
    
    // Find items-*.json files
    const itemsBlobs = blobData.blobs.filter(blob => 
      blob.pathname.startsWith('items-') && blob.pathname.endsWith('.json')
    )
    
    if (itemsBlobs.length === 0) {
      return response.status(404).json({ error: 'No items files' })
    }
    
    // Get latest file
    itemsBlobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    const latestBlob = itemsBlobs[0]
    
    // Return the file content
    const contentResponse = await fetch(latestBlob.url)
    const data = await contentResponse.json()
    
    return response.status(200).json(data)
    
  } catch (error) {
    return response.status(500).json({ error: 'Failed to read blob data' })
  }
}
