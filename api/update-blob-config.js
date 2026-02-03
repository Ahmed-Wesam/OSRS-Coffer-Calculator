import { getOsrsLatest, getOsrsVolume, getOsrsMapping } from '../src/lib/api.js'
import { getDeathsCofferIneligibleNames } from '../src/lib/deathsCofferIneligible.js'
import { addSecurityHeaders, sanitizeInput, validateIP, createRateLimiter } from '../src/lib/security.js'

const JAGEX_API_BASE = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json'

// Create rate limiters
const cronRateLimiter = createRateLimiter(2, 300000) // 2 requests per 5 minutes

// Adaptive rate limiting with failure tracking
let lastJagexFetchAt = 0
let recentFailures = 0
const BASE_RATE_LIMIT_MS = 1200 // Increased to 1.2s for more waiting

function getAdaptiveDelay() {
  return BASE_RATE_LIMIT_MS * Math.pow(1.2, Math.min(recentFailures, 2)) // Much less aggressive
}

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

// Rate limiting for Jagex API - adaptive with failure tracking
const JAGEX_RATE_LIMIT_MS = 500; // 0.5 seconds between calls

async function fetchJagexPrice(itemId, maxRetries = 2) { // Reduced to 2 retries
  // Adaptive rate limiting
  const adaptiveDelay = getAdaptiveDelay();
  const now = Date.now();
  const timeSinceLastFetch = now - lastJagexFetchAt;
  if (timeSinceLastFetch < adaptiveDelay) {
    const waitTime = adaptiveDelay - timeSinceLastFetch;
    console.log(`⏱️ Adaptive rate limiting - waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // ALWAYS retry no matter what - even on success
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      lastJagexFetchAt = Date.now(); // Update last fetch time
      
      const data = await fetchWithRetry(`${JAGEX_API_BASE}?item=${itemId}`);
      
      // Check if response is empty or invalid - ALWAYS retry
      if (!data || !data.item || !data.item.current || !data.item.current.price) {
        console.log(`⚠️ Empty/invalid response for ${itemId}, attempt ${attempt}/${maxRetries} - ALWAYS retrying`);
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 1000 * attempt;
          const jitter = Math.random() * 500; // ±500ms jitter
          const backoffTime = baseDelay + jitter;
          console.log(`⏱️ Backing off ${backoffTime.toFixed(0)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        console.log(`❌ Failed to get valid price for ${itemId} after ${maxRetries} attempts`);
        recentFailures++;
        return null;
      }
      
      const price = data.item.current.price;
      console.log(`✅ Got price for ${itemId}: ${price} (attempt ${attempt})`);
      
      // Reset failure counter on success
      recentFailures = Math.max(0, recentFailures - 1);
      
      // Return immediately on first success - no need to retry
      console.log(`🎯 Got valid price for ${itemId} - returning immediately`);
      return price;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${itemId}:`, error.message);
      if (attempt < maxRetries) {
        // Exponential backoff with jitter for errors
        const baseDelay = 1000 * attempt;
        const jitter = Math.random() * 500;
        const backoffTime = baseDelay + jitter;
        console.log(`⏱️ Backing off ${backoffTime.toFixed(0)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        recentFailures++;
      }
    }
  }
  
  return null;
}

// Consistent price parsing function (same as api.ts)
function parseItemdbPrice(price) {
  const s = String(price ?? '').trim().toLowerCase();
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/);
  if (!m) {
    const n = Number(s.replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }

  const base = Number(m[1]);
  if (!Number.isFinite(base)) return NaN;

  const suffix = m[2];
  if (suffix === 'k') return Math.round(base * 1_000);
  if (suffix === 'm') return Math.round(base * 1_000_000);
  if (suffix === 'b') return Math.round(base * 1_000_000_000);
  return Math.round(base);
}

export default async function handler(request, response) {
  try {
    // Add security headers
    addSecurityHeaders(response)
    
    // Validate request method
    if (request.method !== 'POST') {
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
    
    // Apply rate limiting for cron job
    if (!cronRateLimiter(clientIP)) {
      return response.status(429).json({ 
        error: 'Too many requests',
        message: 'Cron job rate limit exceeded. Please wait before triggering another update.'
      })
    }
    
    // Validate request body
    if (request.body && typeof request.body === 'object') {
      // Sanitize request body to prevent injection
      const sanitizedBody = {}
      for (const [key, value] of Object.entries(request.body)) {
        const sanitizedKey = sanitizeInput(key)
        if (typeof sanitizedKey === 'string' && sanitizedKey.match(/^[a-zA-Z0-9_-]+$/)) {
          sanitizedBody[sanitizedKey] = typeof value === 'string' ? sanitizeInput(value) : value
        }
      }
      request.body = sanitizedBody
    }
    
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

      // Get volume and filter by volume * price ≥ 1m
      const volumeInfo = volumeData[String(candidate.id)]
      const itemVolume = volumeInfo ? Math.max(volumeInfo.highPriceVolume || 0, volumeInfo.lowPriceVolume || 0) : 0
      
      const totalTradingValue = itemVolume * offerPrice
      if (totalTradingValue < 1000000) { // Increased to 1m
        console.log(`⏭️ Skipping ${itemMapping.name} - insufficient trading value: ${totalTradingValue.toLocaleString()} (volume: ${itemVolume}, price: ${offerPrice.toLocaleString()})`)
        continue
      }

      candidateItems.push({
        id: itemId,
        name: itemMapping.name,
        offerPrice,
        sellPrice,
        limit: itemMapping.limit,
        volume: itemVolume // Store volume for later use
      })
    }

    console.log(`📊 Processing ${candidateItems.length} eligible items...`)
    
    // Process items in batches to avoid timeout and improve efficiency
    candidateItems.sort((a, b) => b.sellPrice - a.sellPrice)
    const BATCH_SIZE = 100; // Process 100 items at a time
    const topCandidates = candidateItems; // Process ALL items
    
    console.log(`📊 Will process in ${Math.ceil(topCandidates.length / BATCH_SIZE)} batches of ${BATCH_SIZE} items each`)
    console.log(`⏱️ Estimated time: ${Math.ceil(topCandidates.length * JAGEX_RATE_LIMIT_MS / 1000 / 60)} minutes`)

    const results = []
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i]
      
      try {
        // Progress reporting every 10 items
        if (i % 10 === 0) {
          console.log(`⏳ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(topCandidates.length / BATCH_SIZE)} - Item ${i + 1}/${topCandidates.length} (${((i + 1) / topCandidates.length * 100).toFixed(1)}%) - Success: ${successCount}, Fail: ${failCount}`)
        }
        
        // Get official GE price from Jagex API
        const officialGePrice = await fetchJagexPrice(candidate.id)
        
        if (!officialGePrice || officialGePrice < 1000) {
          console.log(`⏭️ Skipping ${candidate.name} - no valid price`)
          continue
        }

        const price = parseItemdbPrice(officialGePrice)

        // Calculate Death's Coffer value and ROI
        const cofferValue = Math.floor(price * 1.05)
        const buyPrice = candidate.offerPrice
        const profit = cofferValue - buyPrice
        const roi = profit / buyPrice

        if (roi <= 0) {
          console.log(`⏭️ Skipping ${candidate.name} - not profitable`)
          continue
        }

        const itemVolume = candidate.volume

        results.push({
          id: candidate.id,
          name: candidate.name,
          buyPrice,
          officialGePrice: price,
          cofferValue,
          roi,
          volume: itemVolume,
          timestamp: new Date().toISOString(),
          processedAt: new Date().toISOString()
        })
        
        successCount++
        console.log(`✅ Added ${candidate.name} - ROI: ${(roi * 100).toFixed(2)}% - Success: ${successCount}, Fail: ${failCount}`)
        
      } catch (error) {
        console.error(`❌ Error processing item ${candidate.id}:`, error instanceof Error ? error.message : String(error))
        failCount++
        continue
      }
    }

    console.log(`🎯 Processing complete! Success: ${successCount}, Fail: ${failCount}, Total: ${topCandidates.length}`)

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
    
    // Sanitize error message to remove sensitive information
    let errorMessage = 'Blob Storage update failed'
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
      success: false,
      error: errorMessage,
      message: 'An error occurred during the update process'
    })
  }
}
