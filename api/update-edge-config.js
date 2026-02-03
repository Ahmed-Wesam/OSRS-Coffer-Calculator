import { getOsrsLatest, getOsrsVolume, getOsrsMapping } from '../src/lib/api.js'
import { getDeathsCofferIneligibleNames } from '../src/lib/deathsCofferIneligible.js'

const JAGEX_API_BASE = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json'

// Helper function to fetch with retries
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ge-scraper/precompute'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

async function fetchJagexPrice(itemId) {
  try {
    const data = await fetchWithRetry(`${JAGEX_API_BASE}?item=${itemId}`)
    return data.item?.current?.price || null
  } catch (error) {
    console.error(`Failed to fetch Jagex price for item ${itemId}:`, error)
    return null
  }
}

export default async function handler(request, response) {
  try {
    console.log('Starting Blob Storage update...')
    
    // Get all necessary data in parallel
    const [latest, volume, mapping] = await Promise.all([
      getOsrsLatest(),
      getOsrsVolume(),
      getOsrsMapping()
    ])

    const mappingById = new Map(mapping.map(m => [m.id, m]))
    const latestData = latest.data
    const volumeData = volume.data

    // Get ineligible names for filtering first
    const ineligibleNames = await getDeathsCofferIneligibleNames(mapping)
    const ineligibleSet = new Set(Array.from(ineligibleNames).map(name => name.toLowerCase().replace(/\s+/g, ' ')))

    const candidateItems = []
    
    for (const [itemIdStr, priceData] of Object.entries(latestData)) {
      const itemId = Number(itemIdStr)
      if (!Number.isFinite(itemId)) continue

      const itemMapping = mappingById.get(itemId)
      if (!itemMapping) continue

      if (!itemMapping.limit || itemMapping.limit <= 0) continue
      
      const normalizedName = itemMapping.name.toLowerCase().replace(/\s+/g, ' ')
      if (ineligibleSet.has(normalizedName)) return false

      const offerPrice = priceData.low
      const sellPrice = priceData.high

      if (!Number.isFinite(offerPrice) || offerPrice <= 0) continue
      if (!Number.isFinite(sellPrice) || sellPrice <= 0) continue
      if (offerPrice < 1000) continue

      candidateItems.push({
        id: itemId,
        name: itemMapping.name,
        offerPrice,
        sellPrice,
        limit: itemMapping.limit
      })
    }

    console.log(`📊 Processing ${candidateItems.length} eligible items...`)
    
    // Process top candidates (limit to 5 for testing)
    candidateItems.sort((a, b) => b.sellPrice - a.sellPrice)
    const topCandidates = candidateItems.slice(0, 5)

    const results = []
    
    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i]
      
      try {
        console.log(`⏳ Processing item ${i + 1}/${topCandidates.length}: ${candidate.name}`)
        
        // Get official GE price from Jagex API
        const officialGePrice = await fetchJagexPrice(candidate.id)
        
        if (!officialGePrice || officialGePrice < 1000) {
          console.log(`⏭️ Skipping ${candidate.name} - no valid price`)
          continue
        }

        // Parse price string
        const priceStr = String(officialGePrice).toLowerCase()
        let price = 0
        
        if (priceStr.includes('k')) {
          price = parseFloat(priceStr.replace('k', '')) * 1000
        } else if (priceStr.includes('m')) {
          price = parseFloat(priceStr.replace('m', '')) * 1000000
        } else if (priceStr.includes('b')) {
          price = parseFloat(priceStr.replace('b', '')) * 1000000000
        } else {
          price = parseFloat(priceStr)
        }

        if (price < 1000) {
          console.log(`⏭️ Skipping ${candidate.name} - price too low: ${price}`)
          continue
        }

        // Calculate Death's Coffer value and ROI
        const cofferValue = Math.floor(price * 1.05)
        const buyPrice = candidate.offerPrice
        const profit = cofferValue - buyPrice
        const roi = profit / buyPrice

        if (roi <= 0) {
          console.log(`⏭️ Skipping ${candidate.name} - not profitable`)
          continue
        }

        // Get volume
        const volumeInfo = volumeData[String(candidate.id)]
        const itemVolume = volumeInfo ? Math.max(volumeInfo.highPriceVolume || 0, volumeInfo.lowPriceVolume || 0) : 0

        results.push({
          id: candidate.id,
          name: candidate.name,
          buyPrice,
          officialGePrice: price,
          cofferValue,
          roi,
          volume: itemVolume,
          timestamp: new Date().toISOString()
        })
        
        console.log(`✅ Added ${candidate.name} - ROI: ${(roi * 100).toFixed(2)}%`)
        
      } catch (error) {
        console.error(`❌ Error processing item ${candidate.id}:`, error)
        continue
      }
    }

    // Sort by ROI descending
    results.sort((a, b) => b.roi - a.roi)

    // Store data in Vercel Blob Storage with timestamped filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `items-${dateStr}.json`;
    
    const precomputeData = {
      timestamp: now.toISOString(),
      itemCount: results.length,
      items: results
    }
    
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(precomputeData)
    })

    if (!blobResponse.ok) {
      throw new Error(`Blob Storage update failed: ${blobResponse.statusText}`)
    }

    console.log(`✅ Updated Blob Storage with ${results.length} items in ${filename}`)
    
    return response.status(200).json({
      success: true,
      itemCount: results.length,
      filename: filename,
      timestamp: precomputeData.timestamp
    })

  } catch (error) {
    console.error('❌ Blob Storage update failed:', error)
    return response.status(500).json({
      success: false,
      error: error.message
    })
  }
}
