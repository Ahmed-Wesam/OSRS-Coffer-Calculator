import { getOsrsLatest, getOsrsVolume, getOsrsOfficialGuidePrice } from './api'
import { getOsrsMapping } from './api'
import { MIN_OFFICIAL_GE_PRICE } from './constants'

export type OfficialApiDeathCofferRow = {
  id: number
  name: string
  buyPrice: number
  officialGePrice: number
  cofferValue: number
  roi: number
  volume: number
}

export async function fetchOfficialDeathsCofferRows(onProgress?: (results: OfficialApiDeathCofferRow[]) => void): Promise<OfficialApiDeathCofferRow[]> {
  try {
    // Get all necessary data in parallel
    const [latest, volume, mapping] = await Promise.all([
      getOsrsLatest(),
      getOsrsVolume(),
      getOsrsMapping()
    ])

    const mappingById = new Map(mapping.map(m => [m.id, m]))
    const latestData = latest.data
    const volumeData = volume.data

    // First, filter items by basic criteria before making Jagex API calls
    const candidateItems: Array<{id: number, name: string, offerPrice: number, sellPrice: number, limit: number}> = []
    
    for (const [itemIdStr, priceData] of Object.entries(latestData)) {
      const itemId = Number(itemIdStr)
      if (!Number.isFinite(itemId)) continue

      const itemMapping = mappingById.get(itemId)
      if (!itemMapping) continue

      // Skip items without GE limits (not tradable)
      if (!itemMapping.limit || itemMapping.limit <= 0) continue

      const offerPrice = priceData.low // Buy price from OSRS Wiki
      const sellPrice = priceData.high // Sell price from OSRS Wiki

      // Skip invalid price data
      if (!Number.isFinite(offerPrice) || offerPrice <= 0) continue
      if (!Number.isFinite(sellPrice) || sellPrice <= 0) continue

      // Skip very low-priced items (less likely to be profitable)
      if (offerPrice < 1000) continue

      candidateItems.push({
        id: itemId,
        name: itemMapping.name,
        offerPrice,
        sellPrice,
        limit: itemMapping.limit
      })
    }

    // Sort by potential profitability (higher sell prices first)
    candidateItems.sort((a, b) => b.sellPrice - a.sellPrice)
    // Process all candidates, not just top 100
    const allCandidates = candidateItems

    const results: OfficialApiDeathCofferRow[] = []

    // Process all candidates with Jagex API calls
    for (let i = 0; i < allCandidates.length; i++) {
      const candidate = allCandidates[i]
      
      try {
        // Get official GE price from Jagex API (with retry logic)
        const officialGePrice = await getOsrsOfficialGuidePrice(candidate.id)
        
        if (!Number.isFinite(officialGePrice) || officialGePrice < MIN_OFFICIAL_GE_PRICE) {
          continue
        }

        // Calculate Death's Coffer value = GE price × 1.05
        const cofferValue = Math.floor(officialGePrice * 1.05)

        // Calculate ROI
        const profit = cofferValue - candidate.offerPrice
        const roi = profit / candidate.offerPrice

        // Only include profitable items
        if (roi <= 0) continue

        // Get real volume data from OSRS Wiki API
        const volumeInfo = volumeData[String(candidate.id)]
        const volume = volumeInfo ? Math.max(volumeInfo.highPriceVolume, volumeInfo.lowPriceVolume) : 0

        const result = {
          id: candidate.id,
          name: candidate.name,
          buyPrice: candidate.offerPrice,
          officialGePrice,
          cofferValue,
          roi,
          volume
        }

        results.push(result)
        
        // Call progress callback to update UI in real-time
        if (onProgress) {
          // Sort by ROI before passing to UI
          const sortedResults = [...results].sort((a, b) => b.roi - a.roi)
          onProgress(sortedResults)
        }
        
      } catch (error) {
        console.warn(`Error processing item ${candidate.id}:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    // Final sort by ROI descending
    results.sort((a, b) => b.roi - a.roi)
    
    return results

  } catch (error) {
    throw new Error(`Failed to fetch official Death's Coffer data: ${error instanceof Error ? error.message : String(error)}`)
  }
}
