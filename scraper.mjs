import fetch from 'node-fetch';
import config from './config/github-env.js';

// Set environment variables from GitHub secrets or environment
if (config.NODE_ENV === 'production') {
  // Use GitHub secrets in production
  process.env.BLOB_READ_WRITE_TOKEN = config.VERCEL_TOKEN;
  process.env.EDGE_CONFIG_ID = config.VERCEL_ORG_ID;
  process.env.EDGE_CONFIG_TOKEN = config.VERCEL_PROJECT_ID;
} else {
  // Use local environment variables in development
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
  process.env.EDGE_CONFIG_TOKEN = process.env.EDGE_CONFIG_TOKEN;
}

// Constants
const OSRS_LATEST_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/latest';
const OSRS_VOLUME_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/5m';
const OSRS_MAPPING_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/mapping';
const JAGEX_API_BASE = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json';
const WIKI_API_BASE = 'https://oldschool.runescape.wiki/api.php';

// Helper functions
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ge-scraper/precompute'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

async function fetchAllPageLinks(page) {
  const out = [];
  let plcontinue = undefined;
  const url = `https://oldschool.runescape.wiki/api.php?action=query&format=json&prop=links&pllimit=500&titles=${encodeURIComponent(page)}`;

  while (true) {
    const res = await fetch(`${url}${plcontinue ? `&plcontinue=${plcontinue}` : ''}`);
    const text = await res.text().catch(() => { return '' });
    const data = (() => {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from Wiki api.php: ${text.slice(0, 200)}`);
      }
    })();

    const pages = data.query?.pages ?? {};
    for (const p of Object.values(pages)) {
      for (const l of p.links ?? []) {
        // Skip non-main namespace.
        if (l.ns !== 0) continue;
        out.push(l.title);
      }
    }

    plcontinue = data.continue?.plcontinue;
    if (!plcontinue) break;
  }

  return out;
}

async function getDeathsCofferIneligibleIds(mapping) {
  // Create name to ID mapping for lookup
  const nameToIdMap = new Map();
  for (const item of mapping) {
    const normalizedName = item.name.toLowerCase().replace(/\s+/g, ' ');
    nameToIdMap.set(normalizedName, item.id);
  }

  // Pages linked from the OSRS Wiki "Ineligible items" section.
  const sources = ['Leagues_Reward_Shop', 'Grid_Master', 'Deadman_Reward_Store', 'Keel_parts'];

  const explicit = ['old school bond', "belle's folly", 'dragon cannon barrel'].map((n) => n.toLowerCase().replace(/\s+/g, ' '));

  const ineligibleIds = new Set();

  // Add explicit exclusions by looking up their IDs
  for (const name of explicit) {
    const id = nameToIdMap.get(name);
    if (id) {
      ineligibleIds.add(id);
    }
  }

  // Fetch ineligible items from Wiki pages
  for (const page of sources) {
    console.log(`📖 Fetching ineligible items from ${page}...`);
    const titles = await fetchAllPageLinks(page);
    for (const t of titles) {
      const n = t.toLowerCase().replace(/\s+/g, ' ');
      // Look up item ID by name
      const id = nameToIdMap.get(n);
      if (id) {
        ineligibleIds.add(id);
      }
    }
  }

  console.log(`🚫 Found ${ineligibleIds.size} ineligible item IDs`);
  return ineligibleIds;
}

// Rate limiting for Jagex API - conservative to avoid throttling
let lastJagexFetchAt = 0;
let recentFailures = 0;
const BASE_RATE_LIMIT_MS = 3000; // 3 seconds per item

function getAdaptiveDelay() {
  return BASE_RATE_LIMIT_MS * Math.pow(1.2, Math.min(recentFailures, 2)); // Much less aggressive
}

async function fetchJagexPrice(itemId, maxRetries = 10) { // Increased retries to 10
  const adaptiveDelay = getAdaptiveDelay();
  const now = Date.now();
  const timeSinceLastFetch = now - lastJagexFetchAt;
  if (timeSinceLastFetch < adaptiveDelay) {
    const waitTime = adaptiveDelay - timeSinceLastFetch;
    console.log(`⏱️ Adaptive rate limiting - waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastJagexFetchAt = Date.now();
  
  // Keep retrying until we get a valid price
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `${JAGEX_API_BASE}?item=${itemId}`;
      console.log(`🔗 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️ HTTP ${response.status} for ${itemId}, attempt ${attempt}/${maxRetries} - retrying`);
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 500 * attempt;
          const jitter = Math.random() * 200;
          const backoffTime = baseDelay + jitter;
          console.log(`⏱️ Backing off ${backoffTime.toFixed(0)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          recentFailures++;
          continue;
        }
        recentFailures++;
        continue; // Continue to next attempt instead of returning null
      }
      
      const data = await response.json();
      
      if (!data || !data.item || !data.item.current || !data.item.current.price) {
        console.log(`⚠️ Empty/invalid response for ${itemId}, attempt ${attempt}/${maxRetries} - retrying`);
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 500 * attempt;
          const jitter = Math.random() * 200;
          const backoffTime = baseDelay + jitter;
          console.log(`⏱️ Backing off ${backoffTime.toFixed(0)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          recentFailures++;
          continue;
        }
        recentFailures++;
        continue;
      }
      
      const price = data.item.current.price;
      console.log(`✅ Got price for ${itemId}: ${price.toLocaleString()} (attempt ${attempt})`);
      recentFailures = 0; // Reset failure counter on success
      return price;
      
    } catch (error) {
      console.log(`⚠️ Error fetching ${itemId}, attempt ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = 500 * attempt;
        const jitter = Math.random() * 200;
        const backoffTime = baseDelay + jitter;
        console.log(`⏱️ Backing off ${backoffTime.toFixed(0)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        recentFailures++;
        continue;
      }
      recentFailures++;
      continue;
    }
  }
  
  console.log(`❌ Failed to get price for ${itemId} after ${maxRetries} attempts`);
  return null;
}

// Cleanup function to delete old blobs (older than 3 days)
async function cleanupOldBlobs() {
  try {
    console.log('🧹 Starting cleanup of blobs older than 3 days...');
    
    const blobResponse = await fetch(`https://api.vercel.com/v2/blob`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });
    
    if (!blobResponse.ok) {
      throw new Error(`Failed to fetch blob list: ${blobResponse.status}`);
    }
    
    const blobData = await blobResponse.json();
    const cutoffDate = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)); // 3 days ago
    let deletedCount = 0;
    
    for (const blob of blobData.blobs) {
      const uploadDate = new Date(blob.uploadedAt);
      
      if (uploadDate < cutoffDate) {
        try {
          // Delete the old blob
          const deleteResponse = await fetch(`https://api.vercel.com/v2/blob${blob.pathname}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
            }
          });
          
          if (deleteResponse.ok) {
            console.log(`🗑️ Deleted old blob: ${blob.pathname} (uploaded: ${uploadDate.toISOString()})`);
            deletedCount++;
          } else {
            console.log(`⚠️ Failed to delete ${blob.pathname}: ${deleteResponse.status}`);
          }
        } catch (deleteError) {
          console.log(`❌ Error deleting ${blob.pathname}: ${deleteError.message}`);
        }
      }
    }
    
    console.log(`🧹 Cleanup completed. Deleted ${deletedCount} old blobs.`);
    return deletedCount;
    
  } catch (error) {
    console.error(`❌ Cleanup failed: ${error.message}`);
    return 0;
  }
}

// Database upload function
async function uploadToDatabase(filename, content, type) {
  try {
    console.log(`📤 Uploading ${filename} to database as ${type}...`);
    
    // Upload to Vercel Blob Storage in logs directory (separate from items data)
    const blobPath = `logs/${type}-${filename}-${new Date().toISOString().split('T')[0]}.json`;
    
    const response = await fetch(`https://api.vercel.com/v2/blob`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pathname: blobPath,
        content: content,
        contentType: 'application/json'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Blob upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Successfully uploaded ${filename} to blob: ${blobPath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to upload ${filename} to blob: ${error.message}`);
    return false;
  }
}

// Main scraping logic
async function main() {
  const startTime = new Date().toISOString();
  let success = false;
  let error = null;
  
  try {
    console.log('🚀 Starting OSRS scraper...');
    
    // Step 1: Fetch OSRS Wiki data
    console.log('� Fetching OSRS Wiki data...');
    
    const [latestResponse, volumeResponse, mappingData] = await Promise.all([
      fetchWithRetry(OSRS_LATEST_ENDPOINT),
      fetchWithRetry(OSRS_VOLUME_ENDPOINT),
      fetchWithRetry(OSRS_MAPPING_ENDPOINT)
    ]);
    
    // Extract data from the new API response structure
    const latestData = latestResponse.data;
    const volumeData = volumeResponse.data;
    
    console.log(`✅ Got ${Object.keys(latestData).length} latest prices`);
    console.log(`✅ Got ${Object.keys(volumeData).length} volume data`);
    console.log(`✅ Got ${mappingData.length} mapping items`);
    
    // Create mapping for quick lookup
    const mappingById = new Map();
    for (const item of mappingData) {
      mappingById.set(item.id, item);
    }
    
    // Step 2: Get ineligible items for filtering
    console.log('🚫 Fetching ineligible items from Wiki...');
    const ineligibleIds = await getDeathsCofferIneligibleIds(mappingData);
    
    // Step 3: Filter eligible items
    console.log('🔍 Filtering eligible items...');
    const candidateItems = [];
    
    for (const [itemIdStr, priceData] of Object.entries(latestData)) {
      const itemId = Number(itemIdStr);
      if (!Number.isFinite(itemId)) continue;

      const itemMapping = mappingById.get(itemId);
      if (!itemMapping) continue;

      // Check if item is ineligible (filter by ID before API calls)
      if (ineligibleIds.has(itemId)) {
        console.log(`⏭️ Skipping ${itemMapping.name} (ID: ${itemId}) - ineligible item`);
        continue;
      }

      const offerPrice = priceData.low;
      const sellPrice = priceData.high;

      if (!Number.isFinite(offerPrice) || offerPrice <= 0) continue;
      if (!Number.isFinite(sellPrice) || sellPrice <= 0) continue;

      // Get volume and include ALL items (no filtering)
      const volumeInfo = volumeData[String(itemId)];
      const itemVolume = volumeInfo ? Math.max(volumeInfo.highPriceVolume || 0, volumeInfo.lowPriceVolume || 0) : 0;
      
      // DEBUG: Log first few items to see data
      if (candidateItems.length < 5) {
        console.log(`DEBUG: ${itemMapping.name} - price: ${offerPrice.toLocaleString()}, volume: ${itemVolume}, limit: ${itemMapping.limit || 0}`);
      }

      // Filter BEFORE Jagex API - only items with offerPrice ≥ 100k
      if (offerPrice < 100000) {
        console.log(`⏭️ Pre-filtering ${itemMapping.name} - offer price too low: ${offerPrice.toLocaleString()}`);
        continue;
      }

      candidateItems.push({
        id: itemId,
        name: itemMapping.name,
        offerPrice,
        sellPrice,
        limit: itemMapping.limit || 0,
        volume: itemVolume // Store volume for later use
      });
    }

    console.log(`📊 Found ${candidateItems.length} eligible items`);

    // Step 4: Process ALL eligible items - GO ALL OUT!
    console.log(`🔥 GOING ALL OUT! Processing ALL ${candidateItems.length} eligible items...`);
    const topCandidates = candidateItems; // Process ALL items, not just 100

    // Process items with retry until successful
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    console.log(`📊 Processing ${topCandidates.length} items with 2-second rate limiting and retry until successful...`);
    
    for (let i = 0; i < topCandidates.length; i++) {
      const candidate = topCandidates[i];
    
      try {
        console.log(`⏳ [${i + 1}/${topCandidates.length}] ${candidate.name} (${((i + 1) / topCandidates.length * 100).toFixed(1)}%) - Success: ${successCount}, Fail: ${failCount}`);
        
        let officialGePrice = await fetchJagexPrice(candidate.id);
        
        // Keep retrying until we get a valid price (any price > 0)
        while (!officialGePrice || officialGePrice <= 0) {
          console.log(`🔄 Retrying ${candidate.name} - no valid price yet, trying again...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          officialGePrice = await fetchJagexPrice(candidate.id);
        }

        const price = officialGePrice;

        const cofferValue = Math.floor(price * 1.05);
        const buyPrice = candidate.offerPrice;
        const profit = cofferValue - buyPrice;
        const roi = profit / buyPrice;

        if (roi <= 0) {
          console.log(`⏭️ Skipping ${candidate.name} - not profitable`);
          failCount++;
          continue;
        }

        const itemVolume = candidate.volume;

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
        });
        
        successCount++;
        console.log(`✅ Added ${candidate.name} - ROI: ${(roi * 100).toFixed(2)}% - Success: ${successCount}, Fail: ${failCount}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${candidate.name}:`, error.message);
        failCount++;
      }
    }

    // Sort by ROI descending
    results.sort((a, b) => b.roi - a.roi);

    console.log(`🎯 Found ${results.length} profitable items!`);
    
    // Save results to file
    const fs = await import('fs');
    const outputPath = 'coffer-calculator-data.json';
    await fs.promises.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to ${outputPath}`);
    
    // Display top 10 items
    console.log(`\n🏆 Top 10 items by ROI:`);
    results.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ROI: ${(item.roi * 100).toFixed(2)}% - GE: ${item.officialGePrice.toLocaleString()}, Offer: ${item.buyPrice.toLocaleString()}`);
    });
    
    console.log(`\n✨ OSRS scraper completed successfully!`);
    success = true;
    
  } catch (error) {
    console.error(`❌ Fatal error in scraper: ${error.message}`);
    console.error(error.stack);
    error = error.message;
    success = false;
  }
  
  // Handle database uploads for both success and failure cases
  const endTime = new Date().toISOString();
  
  try {
    // Run cleanup first to remove old data
    await cleanupOldBlobs();
    
    const fs = await import('fs');
    
    // Create and upload execution log
    const executionLog = {
      startTime: startTime,
      endTime: endTime,
      success: success,
      error: error,
      timestamp: new Date().toISOString()
    };
    
    await uploadToDatabase('execution-log', JSON.stringify(executionLog, null, 2), 'execution');
    
    // Upload scraper output log if it exists
    if (fs.existsSync('scraper-output.txt')) {
      const outputContent = await fs.promises.readFile('scraper-output.txt', 'utf8');
      await uploadToDatabase('scraper-output', outputContent, 'log');
    }
    
    // Upload data file if it exists and scraper was successful
    if (success && fs.existsSync('coffer-calculator-data.json')) {
      const dataContent = await fs.promises.readFile('coffer-calculator-data.json', 'utf8');
      await uploadToDatabase('scraper-data', dataContent, 'data');
    }
    
    console.log(`📤 All uploads completed. Status: ${success ? 'SUCCESS' : 'FAILURE'}`);
    
  } catch (uploadError) {
    console.error(`❌ Error during database uploads: ${uploadError.message}`);
  }
  
  // Exit with appropriate code
  if (!success) {
    process.exit(1);
  }
}

// Run the scraper
main().catch(error => {
  console.error(`❌ Unhandled error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
