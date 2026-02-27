import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { put, del, list } from '@vercel/blob';
import config from './config/github-env';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Set environment variables from GitHub secrets or environment
if (config.NODE_ENV === 'production') {
  // Use GitHub secrets in production
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is missing in GitHub secrets!');
    process.exit(1);
  }
}

// Constants
const OSRS_LATEST_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/latest';
const OSRS_VOLUME_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/24h';
const OSRS_MAPPING_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/mapping';
const JAGEX_API_BASE = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json';
const MIN_OFFER_PRICE = 100000;
const CLEANUP_DAYS = 3;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_DELAY = 1000;

// Hardcoded ineligible items not listed in wiki
const HARDCODED_INELIGIBLE_ITEMS = new Set([31245, 31585]);

// Type definitions
interface PriceData {
  high: number;
  highTime: number;
  low: number;
  lowTime: number;
}

interface LatestData {
  [itemId: string]: PriceData;
}

interface MappingItem {
  id: number;
  name: string;
  members: boolean;
  ineligible?: boolean;
  examine?: string;
  lowalch?: number;
  limit?: number;
  value?: number;
  highalch?: number;
  icon?: string;
}

interface ScrapedItem extends MappingItem {
  offerPrice: number;
  sellPrice: number;
}

interface ResultItem {
  id: number;
  name: string;
  gePrice: number;
  offerPrice: number;
  cofferValue: number;
  roi: number;
  lowPriceVolume: number;
  members: boolean;
  timestamp: string;
}

interface JagexApiResponse {
  item: {
    current: {
      price: string;
    };
  };
}

// Helper functions
async function fetchWithRetry(url: string, retries = DEFAULT_MAX_RETRIES, delay = DEFAULT_DELAY): Promise<unknown> {
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

// Parse formatted price strings like "61.6m" or "2.1b" into numbers
function parseFormattedPrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (typeof priceStr !== 'string') return NaN;
  
  const str = priceStr.toLowerCase().replace(/,/g, '').trim();
  const match = str.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/);
  
  if (!match) {
    const num = Number(str);
    return Number.isFinite(num) ? num : NaN;
  }
  
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return NaN;
  
  const suffix = match[2];
  if (suffix === 'k') return Math.round(base * 1_000);
  if (suffix === 'm') return Math.round(base * 1_000_000);
  if (suffix === 'b') return Math.round(base * 1_000_000_000);
  
  return Math.round(base);
}

let recentFailures = 0;
let lastJagexFetchAt = 0;

function getAdaptiveDelay(): number {
  return 2000 * Math.pow(1.2, Math.min(recentFailures, 2));
}

async function fetchJagexPrice(itemId: number, maxRetries = 10): Promise<number | null> {
  const adaptiveDelay = getAdaptiveDelay();
  const now = Date.now();
  const timeSinceLastFetch = now - lastJagexFetchAt;
  
  if (timeSinceLastFetch < adaptiveDelay) {
    const waitTime = adaptiveDelay - timeSinceLastFetch;
    console.log(`⏱️ Adaptive rate limiting - waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastJagexFetchAt = Date.now();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `${JAGEX_API_BASE}?item=${itemId}`;
      console.log(`🔗 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log(`⚠️ HTTP ${response.status} for ${itemId}, attempt ${attempt}/${maxRetries} - retrying`);
        if (attempt < maxRetries) {
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
      
      const data = await response.json() as JagexApiResponse;
      
      if (!data || !data.item || !data.item.current || !data.item.current.price) {
        console.log(`⚠️ Empty/invalid response for ${itemId}, attempt ${attempt}/${maxRetries} - retrying`);
        if (attempt < maxRetries) {
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
      
      const price = parseFormattedPrice(data.item.current.price);
      console.log(`✅ Got price for ${itemId}: ${price.toLocaleString()} (attempt ${attempt})`);
      recentFailures = 0;
      return price;
      
    } catch (error) {
      const err = error as Error;
      console.log(`⚠️ Error fetching ${itemId}, attempt ${attempt}/${maxRetries}: ${err.message}`);
      if (attempt < maxRetries) {
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

// Cleanup function to delete old blobs (older than specified days)
async function cleanupOldBlobs(daysOld = CLEANUP_DAYS): Promise<number> {
  try {
    console.log(`🧹 Starting cleanup of blobs older than ${daysOld} days...`);
    
    // List all blobs
    const blobs = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    console.log(`� Found ${blobs.blobs.length} blobs total`);
    
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const blob of blobs.blobs) {
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (uploadedAt < cutoffTime) {
        console.log(`🗑️ Deleting old blob: ${blob.pathname} (uploaded: ${blob.uploadedAt})`);
        
        try {
          await del(blob.pathname, {
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          deletedCount++;
          console.log(`✅ Successfully deleted ${blob.pathname}`);
        } catch (deleteError) {
          console.log(`⚠️ Failed to delete ${blob.pathname}: ${(deleteError as Error).message}`);
        }
      }
    }
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old blobs.`);
    return deletedCount;
    
  } catch (error) {
    console.error(`❌ Cleanup failed: ${(error as Error).message}`);
    return -1; // Return -1 to indicate failure
  }
}

// Database upload function
async function uploadToDatabase(filename: string, content: string, type: string): Promise<boolean> {
  try {
    let blobPath: string;
    if (type === 'data') {
      blobPath = `ob/${filename}`; // Write to ob/ directory for data files
    } else {
      blobPath = `logs/${type}-${filename}-${new Date().toISOString().split('T')[0]}.json`;
    }
    
    // Use the Vercel Blob SDK put method
    await put(blobPath, content, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/json',
      addRandomSuffix: true
    });
    
    console.log(`✅ Successfully uploaded ${filename} to blob storage`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to upload ${filename} to blob: ${(error as Error).message}`);
    return false;
  }
}

// Fetch ineligible items from Wiki pages
async function fetchIneligibleItems(): Promise<Set<number>> {
  const ineligibleIds = new Set<number>();
  
  // Pages linked from the OSRS Wiki "Ineligible items" section
  const sources = ['Leagues_Reward_Shop', 'Grid_Master', 'Deadman_Reward_Store', 'Keel_parts'];
  const explicit = ['old school bond', "belle's folly", 'dragon cannon barrel'].map((n) => n.toLowerCase().replace(/\s+/g, ' '));
  
  // Add explicit exclusions by looking up their IDs
  const mappingData = await fetchWithRetry(OSRS_MAPPING_ENDPOINT) as MappingItem[];
  const nameToIdMap = new Map<string, number>();
  
  for (const item of mappingData) {
    const normalizedName = item.name.toLowerCase().replace(/\s+/g, ' ');
    nameToIdMap.set(normalizedName, item.id);
  }
  
  for (const name of explicit) {
    const id = nameToIdMap.get(name);
    if (id) {
      ineligibleIds.add(id);
    }
  }
  
  // Fetch ineligible items from Wiki pages
  for (const source of sources) {
    try {
      const pageLinks = await fetchAllPageLinks(source);
      for (const link of pageLinks) {
        const normalizedName = link.toLowerCase().replace(/\s+/g, ' ');
        const id = nameToIdMap.get(normalizedName);
        if (id) {
          ineligibleIds.add(id);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.warn(`Warning: Could not fetch ineligible items from ${source}: ${error.message}`);
    }
  }
  
  return ineligibleIds;
}

async function fetchAllPageLinks(page: string): Promise<string[]> {
  const out: string[] = [];
  let plcontinue: string | undefined;
  const url = `https://oldschool.runescape.wiki/api.php?action=query&format=json&prop=links&pllimit=500&titles=${encodeURIComponent(page)}`;
  
  while (true) {
    const res = await fetch(`${url}${plcontinue ? `&plcontinue=${plcontinue}` : ''}`);
    const data = await res.json() as unknown;
    
    const queryData = (data as { query?: { pages?: Record<string, unknown> } }).query;
    const pages = Object.values(queryData?.pages || {});
    for (const pageData of pages) {
      const pageDataObj = pageData as { links?: { title: string }[] };
      if (pageDataObj.links) {
        for (const link of pageDataObj.links) {
          out.push(link.title);
        }
      }
    }
    
    const continueData = (data as { continue?: { plcontinue?: string } }).continue;
    if (!continueData?.plcontinue) break;
    plcontinue = continueData.plcontinue;
  }
  
  return out;
}

// Configuration interface
interface RefreshConfig {
  cleanupDays?: number;
}

// Default configuration
const DEFAULT_CONFIG: RefreshConfig = {
  cleanupDays: CLEANUP_DAYS
};

// Get configuration from environment or defaults
function getConfig(): RefreshConfig {
  return {
    cleanupDays: process.env.CLEANUP_DAYS ? parseInt(process.env.CLEANUP_DAYS) : DEFAULT_CONFIG.cleanupDays
  };
}

// Get minimum offer price from environment or default
function getMinOfferPrice(): number {
  return process.env.MIN_OFFER_PRICE ? parseInt(process.env.MIN_OFFER_PRICE) : MIN_OFFER_PRICE;
}

// Database connectivity check function
async function checkDatabaseConnectivity(): Promise<boolean> {
  try {
    // Try to list blobs to verify we have read access
    await list({
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    return true;
    
  } catch (error) {
    console.error(`❌ Database connectivity failed: ${(error as Error).message}`);
    return false;
  }
}

// Main scraping logic
async function main(): Promise<void> {
  let success = false;
  
  try {
    console.log('🚀 Starting OSRS data refresh...');
    
    // Check database connectivity first
    const dbConnected = await checkDatabaseConnectivity();
    if (!dbConnected) {
      console.error('❌ Cannot proceed with data refresh - database connectivity failed');
      process.exit(1);
    }
    
    // Fetch ineligible items
    console.log('🚫 Fetching ineligible items...');
    const ineligibleIds = await fetchIneligibleItems();
    
    // Fetch mapping data
    console.log('📋 Fetching item mapping...');
    const mappingData: MappingItem[] = await fetchWithRetry(OSRS_MAPPING_ENDPOINT) as MappingItem[];
    
    // Fetch latest price data
    console.log('💰 Fetching latest price data...');
    let latestData = await fetchWithRetry(OSRS_LATEST_ENDPOINT) as LatestData;
    
    // Handle nested API response structure
    const firstKey = Object.keys(latestData)[0];
    
    if (firstKey === 'data') {
      latestData = latestData[firstKey] as unknown as LatestData;
    } else if (firstKey && typeof latestData[firstKey] === 'object' && !!(latestData[firstKey] as PriceData).high) {
      latestData = latestData[firstKey] as unknown as LatestData;
    }
    
    console.log('📊 Fetching volume data...');
    
    // Fetch volume data from OSRS Wiki API (24h interval for better volume data)
    const volumeResponse = await fetch(OSRS_VOLUME_ENDPOINT);
    const volumeData = await volumeResponse.json() as { data: Record<string, { highPriceVolume: number; lowPriceVolume: number }> };
    console.log(`✅ Fetched volume data for ${Object.keys(volumeData.data).length} items`);
    
    // Filter eligible items
    const eligibleItems: ScrapedItem[] = mappingData.filter((item: MappingItem) => {
      // Skip ineligible items from wiki
      if (ineligibleIds.has(item.id)) {
        console.log(`⏭️ Skipping ${item.name} (ID: ${item.id}) - ineligible item`);
        return false;
      }
      
      // Skip hardcoded ineligible items
      if (HARDCODED_INELIGIBLE_ITEMS.has(item.id)) {
        console.log(`⏭️ Skipping ${item.name} (ID: ${item.id}) - hardcoded ineligible item`);
        return false;
      }
      
      // Get price data for this item
      const priceData = latestData[String(item.id)];
      if (!priceData || !priceData.low || !priceData.high) {
        console.log(`⏭️ Skipping ${item.name} - no price data`);
        return false;
      }
      
      const offerPrice = Number(priceData.low);
      const sellPrice = Number(priceData.high);
      
      // Skip items with very low prices
      const minOfferPrice = getMinOfferPrice();
      if (offerPrice < minOfferPrice) {
        console.log(`⏭️ Pre-filtering ${item.name} - offer price too low: ${offerPrice.toLocaleString()}`);
        return false;
      }
      
      // Store price data in the item object for later use
      (item as ScrapedItem).offerPrice = offerPrice;
      (item as ScrapedItem).sellPrice = sellPrice;
      
      return true;
    }) as ScrapedItem[];
    
    console.log(`📊 Found ${eligibleItems.length} eligible items`);
    
    console.log(`🔥 Processing ${eligibleItems.length} items with rate limiting and retry...`);
    
    const results: ResultItem[] = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const progress = ((i + 1) / eligibleItems.length * 100).toFixed(1);
      
      if (i % 10 === 0 || i === eligibleItems.length - 1) {
        console.log(`⏳ Progress: ${i + 1}/${eligibleItems.length} (${progress}%) - Success: ${successCount}, Fail: ${failCount}`);
      }
      
      try {
        const price = await fetchJagexPrice(item.id);
        
        if (price !== null) {
          // Calculate Death's Coffer ROI
          const gePrice = Number(price);
          const cofferValue = Math.floor(gePrice * 1.05);
          const buyPrice = Number(item.offerPrice);
          const profit = cofferValue - buyPrice;
          const roi = Number((profit / buyPrice * 100).toFixed(2));
          
          // Only include items with positive ROI
          if (profit > 0) {
            // Get volume data for this item from OSRS Wiki
            const volumeInfo = volumeData.data[String(item.id)];
            const lowPriceVolume = volumeInfo ? (volumeInfo.lowPriceVolume || 0) : 0;
            
            results.push({
              id: item.id,
              name: item.name,
              gePrice,
              offerPrice: buyPrice,
              cofferValue,
              roi,
              lowPriceVolume,
              members: item.members,
              timestamp: new Date().toISOString()
            });
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    console.log(`\n🎉 Scraping completed!`);
    console.log(`✅ Successful items: ${successCount}`);
    console.log(`❌ Failed items: ${failCount}`);
    console.log(`📊 Profitable items found: ${results.length}`);
    
    // Sort by ROI (highest first)
    results.sort((a, b) => b.roi - a.roi);
    
    // Display top 10 items
    console.log(`\n🏆 Top 10 items by ROI:`);
    results.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ROI: ${item.roi.toFixed(2)}% - GE: ${item.gePrice.toLocaleString()}, Offer: ${item.offerPrice.toLocaleString()}`);
    });
    
    console.log(`\n✨ OSRS data refresh completed successfully!`);
    success = true;
    
    // Upload data to database if successful
    if (success) {
      // Generate filename for database upload
      const today = new Date().toISOString().split('T')[0];
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const dataFileName = `items-${today}-${randomSuffix}.json`;
      
      // Upload data directly to database
      const dataContent = JSON.stringify(results, null, 2);
      const dataUploadResult = await uploadToDatabase(dataFileName, dataContent, 'data');
      const uploadCount = dataUploadResult ? 1 : 0;
      console.log(`📤 Data upload: ${uploadCount > 0 ? 'SUCCESS' : 'FAILED'}`);
    }
    
  } catch (err) {
    const errorObj = err as Error;
    console.error(`❌ Fatal error in data refresh: ${errorObj.message}`);
    console.error(errorObj.stack);
    success = false;
  }
  
  // Handle database uploads and cleanup
  let cleanupSuccess = false;
  let uploadSuccess = false;
  const uploadCount = 0;
  const uploadFailures = 0;
  
  try {
    // Run cleanup first to remove old data
    const config = getConfig();
    const cleanupResult = await cleanupOldBlobs(config.cleanupDays || CLEANUP_DAYS);
    cleanupSuccess = cleanupResult >= 0; // If no error thrown, consider it success
    
    // Determine overall upload success
    uploadSuccess = uploadFailures === 0;
    
    console.log(`📤 Uploads completed: ${uploadCount} successful, ${uploadFailures} failed`);
    console.log(`📤 Overall status: ${success && cleanupSuccess && uploadSuccess ? 'SUCCESS' : 'PARTIAL_FAILURE'}`);
    
    // Update overall success status
    success = success && cleanupSuccess && uploadSuccess;
    
  } catch (uploadError) {
    const error = uploadError as Error;
    console.error(`❌ Error during database uploads: ${error.message}`);
    success = false;
  }
  
  // Exit with appropriate code
  if (!success) {
    process.exit(1);
  }
}

// Run the data refresh
main().catch((err) => {
  const error = err as Error;
  console.error(`❌ Unhandled error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
