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

// Main scraping logic
async function main() {
  try {
    console.log('🚀 Starting OSRS scraper...');
    
    // Fetch mapping data
    console.log('📋 Fetching item mapping...');
    const mappingData = await fetchWithRetry(OSRS_MAPPING_ENDPOINT);
    
    // Filter eligible items (exclude certain categories)
    const eligibleItems = mappingData.filter(item => {
      // Skip ineligible items
      if (item.ineligible) {
        console.log(`⏭️ Skipping ${item.name} (ID: ${item.id}) - ineligible item`);
        return false;
      }
      
      // Skip items with very low prices (likely not profitable)
      if (item.value < 1000) {
        console.log(`⏭️ Pre-filtering ${item.name} - offer price too low: ${item.value.toLocaleString()}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`📊 Found ${eligibleItems.length} eligible items`);
    console.log(`🔥 GOING ALL OUT! Processing ALL ${eligibleItems.length} eligible items...`);
    console.log(`📊 Processing ${eligibleItems.length} items with 2-second rate limiting and retry until successful...`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const progress = ((i + 1) / eligibleItems.length * 100).toFixed(1);
      
      console.log(`⏳ [${i + 1}/${eligibleItems.length}] ${item.name} (${progress}%) - Success: ${successCount}, Fail: ${failCount}`);
      
      try {
        const price = await fetchJagexPrice(item.id);
        
        if (price !== null) {
          // Calculate ROI (profit margin)
          const roi = ((price - item.value) / item.value * 100).toFixed(2);
          
          // Only include items with positive ROI
          if (price > item.value) {
            results.push({
              id: item.id,
              name: item.name,
              gePrice: price,
              offerPrice: item.value,
              roi: parseFloat(roi),
              members: item.members,
              timestamp: new Date().toISOString()
            });
            console.log(`✅ Added ${item.name} - ROI: ${roi}% - Success: ${successCount + 1}, Fail: ${failCount}`);
            successCount++;
          } else {
            console.log(`❌ Skipped ${item.name} - Negative ROI: ${roi}% - Success: ${successCount}, Fail: ${failCount + 1}`);
            failCount++;
          }
        } else {
          console.log(`❌ Failed to get price for ${item.name} - Success: ${successCount}, Fail: ${failCount + 1}`);
          failCount++;
        }
        
        // Rate limiting between items
        if (i < eligibleItems.length - 1) {
          const delay = getAdaptiveDelay();
          console.log(`⏱️ Adaptive rate limiting - waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${item.name}: ${error.message} - Success: ${successCount}, Fail: ${failCount + 1}`);
        failCount++;
      }
    }
    
    console.log(`\n🎉 Scraping completed!`);
    console.log(`✅ Successful items: ${successCount}`);
    console.log(`❌ Failed items: ${failCount}`);
    console.log(`📊 Profitable items found: ${results.length}`);
    
    // Sort by ROI (highest first)
    results.sort((a, b) => b.roi - a.roi);
    
    // Save results to file
    const fs = await import('fs');
    const outputPath = 'coffer-calculator-data.json';
    await fs.promises.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to ${outputPath}`);
    
    // Display top 10 items
    console.log(`\n🏆 Top 10 items by ROI:`);
    results.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ROI: ${item.roi}% - GE: ${item.gePrice.toLocaleString()}, Offer: ${item.offerPrice.toLocaleString()}`);
    });
    
    console.log(`\n✨ OSRS scraper completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Fatal error in scraper: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the scraper
main().catch(error => {
  console.error(`❌ Unhandled error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
