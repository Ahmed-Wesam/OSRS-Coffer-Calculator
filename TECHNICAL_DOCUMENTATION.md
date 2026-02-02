# OSRS Death's Coffer ROI Calculator - Technical Documentation

## 📖 **Overview**

The OSRS Death's Coffer ROI Calculator is a sophisticated web application that analyzes profitable items from Death's Coffer mechanics in Old School RuneScape. It fetches data from multiple sources, applies complex filtering logic, and presents ROI calculations in a clean, responsive interface.

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Deployment**: Netlify with serverless functions
- **Styling**: Custom CSS with modern design patterns
- **Data Sources**: GE Tracker, OSRS Wiki APIs

### **System Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│  Netlify Function │◄──►│  GE Tracker     │
│   (React App)   │    │   (CORS Proxy)   │    │   (HTML Page)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  Local Storage  │    │  OSRS Wiki API   │
│   (Caching)     │    │   (JSON Data)    │
└─────────────────┘    └──────────────────┘
```

## 📁 **Project Structure**

### **Core Application Files**
```
src/
├── components/
│   └── ErrorBoundary.tsx          # React error boundary component
├── lib/
│   ├── api.ts                     # OSRS Wiki API client with caching
│   ├── cache.ts                   # localStorage caching utilities
│   ├── constants.ts               # Application configuration
│   ├── deathsCofferIneligible.ts  # Ineligible items filtering logic
│   ├── geTracker.ts               # GE Tracker HTML parsing
│   ├── types.ts                   # TypeScript type definitions
│   └── roi.ts                     # (unused) ROI calculation utilities
├── App.tsx                        # Main application component
├── main.tsx                       # Application entry point
└── App.css                        # Application styles
```

### **Infrastructure Files**
```
netlify/functions/
└── ge-tracker.js                  # Serverless CORS proxy

public/
└── favicon.svg                    # Custom application favicon

package.json                       # Dependencies and scripts
vite.config.ts                     # Vite build configuration
```

## 🔧 **Core Components**

### **1. Main Application (`App.tsx`)**

The heart of the application that orchestrates data fetching, processing, and UI rendering.

#### **Key Responsibilities**
- **Data Fetching**: Coordinates API calls to multiple sources
- **Data Processing**: Applies filtering, deduplication, and sorting
- **State Management**: Manages loading states, errors, and user filters
- **UI Rendering**: Renders the filterable data table

#### **Core Functions**
```typescript
// Data formatting utilities
function formatInt(n: number): string     // Formats numbers with commas
function formatPct(p: number): string    // Formats percentages
function itemUrl(id: number): string     // Generates wiki item URLs
function normalizeName(s: string): string // Normalizes item names for comparison
function parsePriceInput(raw: string): number | null // Parses user price input

// Main component logic
function App(): JSX.Element              // Main React component
```

#### **Data Flow**
1. **Fetch**: GE Tracker HTML + OSRS Wiki mapping data
2. **Process**: Parse HTML, calculate ROI, apply filters
3. **Cache**: Store processed data for performance
4. **Render**: Display filtered, sorted results

### **2. API Client (`lib/api.ts`)**

Handles all external API communications with robust error handling and rate limiting.

#### **Key Features**
- **Rate Limiting**: Prevents API abuse with sequential request queuing
- **Retry Logic**: Exponential backoff for failed requests
- **Caching**: Integrates with localStorage for performance
- **Error Handling**: Comprehensive error reporting

#### **API Functions**
```typescript
export async function getOsrsMapping(): Promise<OsrsMappingItem[]>
export async function getOsrsLatest(): Promise<OsrsLatestResponse>
export async function getOsrsOfficialGuidePrice(itemId: number): Promise<number>
```

#### **Rate Limiting Implementation**
```typescript
let lastFetchAt = 0
let fetchQueue: Promise<unknown> = Promise.resolve()

async function rateLimitedFetch(input: RequestInfo | URL, init?: RequestInit, minIntervalMs = DEFAULT_RATE_LIMIT_MS): Promise<Response>
```

### **3. Caching System (`lib/cache.ts`)**

Sophisticated client-side caching with TTL-based expiration.

#### **Cache Structure**
```typescript
type CacheEnvelope<T> = {
  v: T        // Actual cached data
  t: number   // Timestamp (Date.now())
}
```

#### **Cache Functions**
```typescript
export function readCache<T>(key: string, maxAgeMs: number): T | null
export function writeCache<T>(key: string, value: T): void
```

#### **Cache Strategy**
- **Mapping Data**: 15 minutes (rarely changes, large payload)
- **Latest Prices**: 1 minute (high-frequency data)
- **Guide Prices**: 24 hours (official prices change slowly)
- **Ineligible Items**: 24 hours (eligibility rules change infrequently)

### **4. GE Tracker Parser (`lib/geTracker.ts`)**

Parses HTML from GE Tracker to extract Death's Coffer item data.

#### **Parsing Process**
1. **HTML Parsing**: Uses DOMParser to convert HTML string to DOM
2. **Data Extraction**: Selects specific table rows and cells
3. **Type Conversion**: Converts text to numbers with validation
4. **Error Handling**: Gracefully handles malformed data

#### **Key Functions**
```typescript
export function parseGeTrackerDeathsCofferHtml(html: string): GeTrackerDeathCofferRow[]
export async function fetchGeTrackerDeathsCofferRows(): Promise<GeTrackerDeathCofferRow[]>
```

#### **Data Structure**
```typescript
export type GeTrackerDeathCofferRow = {
  id: number
  name: string
  offerPrice: number
  officialGePrice: number
  cofferValue: number
  roiPct: number
}
```

### **5. Ineligible Items Filter (`lib/deathsCofferIneligible.ts`)**

Fetches and processes ineligible item lists from OSRS Wiki.

#### **Filtering Strategy**
- **Wiki Sources**: Fetches from specific wiki pages (Leagues, Deadman, etc.)
- **Name Normalization**: Standardizes item names for comparison
- **Cross-Reference**: Validates against OSRS mapping data
- **Caching**: Stores results for 24 hours

#### **Sources Checked**
- Leagues Reward Shop
- Grid Master items
- Deadman Reward Store
- Keel parts
- Explicit exclusions (bonds, specific items)

### **6. Serverless CORS Proxy (`netlify/functions/ge-tracker.js`)**

Handles CORS issues by proxying GE Tracker requests through Netlify Functions.

#### **Implementation**
```javascript
exports.handler = async (event) => {
  // CORS headers setup
  // Proxy request to GE Tracker
  // Return response with proper headers
}
```

#### **Benefits**
- **CORS Solution**: Bypasses browser same-origin policy
- **Reliability**: More robust than public CORS proxies
- **Performance**: Server-to-server requests are faster

## 🔄 **Data Processing Pipeline**

### **Complete Data Flow**
```
1. Initial Load
   ├── Fetch GE Tracker HTML (via Netlify function)
   ├── Fetch OSRS Wiki mapping
   ├── Fetch ineligible items list
   └── Parse and process all data

2. Data Processing
   ├── Parse HTML to extract item data
   ├── Calculate ROI for each item
   ├── Apply eligibility filters
   ├── Remove duplicates (keep highest ROI per item)
   └── Sort by ROI (descending)

3. Caching
   ├── Store processed results
   ├── Cache individual API responses
   └── Set appropriate TTLs

4. UI Updates
   ├── Display loading states
   ├── Show error messages if needed
   ├── Render filtered data table
   └ Handle user interactions
```

### **Filtering Logic**
```typescript
const computed: DeathCofferRow[] = ge
  .map((r) => ({ /* transform data */ }))
  .filter((r) => r.roi > 0)                    // Only profitable items
  .filter((r) => r.officialGePrice >= 10_000)   // Minimum GE price
  .filter((r) => hasGeLimit(mappingById, r.id)) // Must be tradable
  .filter((r) => !isIneligible(normalizeName(r.name))) // Exclude ineligible
```

### **Deduplication Strategy**
```typescript
// GE Tracker can have duplicate rows for same item
const byId = new Map<number, DeathCofferRow>()
for (const r of computed) {
  const prev = byId.get(r.id)
  if (!prev || r.roi > prev.roi) byId.set(r.id, r) // Keep highest ROI
}
```

## 🎨 **UI/UX Implementation**

### **Design System**
- **Color Palette**: Deep charcoal background with emerald green accents
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent padding and margins
- **Responsive**: Mobile-first design approach

### **Component Structure**
```typescript
<div className="app">
  <div className="header">
    <h1>OSRS Death's Coffer ROI Calculator</h1>
    <div className="controls">
      {/* Filter inputs */}
    </div>
  </div>
  
  {/* Loading/Error states */}
  
  <div className="tableWrap">
    <table className="table">
      {/* Data table */}
    </table>
  </div>
</div>
```

### **Filter Controls**
- **Min Buy Price**: Supports k/m/b suffixes
- **Max Buy Price**: Supports k/m/b suffixes  
- **Min ROI (%)**: Percentage input with decimal support
- **Reset Button**: Clears all filters

### **Table Features**
- **Centered Headers**: All column headers centered
- **Right-Aligned Numbers**: Numerical columns right-aligned
- **Hover Effects**: Subtle row highlighting
- **Links**: Item names link to OSRS Wiki
- **ROI Highlighting**: Green color for ROI percentages

## 🔒 **Security Considerations**

### **CORS Handling**
- **Development**: Vite proxy handles CORS locally
- **Production**: Netlify function with proper CORS headers
- **No Public Proxies**: Avoids unreliable third-party services

### **Input Validation**
- **Price Parsing**: Validates numeric input with suffixes
- **Sanitization**: All user inputs properly sanitized
- **Type Safety**: TypeScript prevents runtime type errors

### **Data Privacy**
- **No Sensitive Data**: No personal information stored
- **LocalStorage Only**: Non-sensitive caching only
- **HTTPS Only**: All API calls use HTTPS

## 📊 **Performance Optimization**

### **Caching Strategy**
- **Multi-Level**: API response + processed data caching
- **TTL-Based**: Appropriate expiration times per data type
- **Versioned Keys**: Prevents cache conflicts
- **Graceful Fallback**: Serves stale data if fetch fails

### **React Optimizations**
- **useMemo**: Prevents unnecessary recalculations
- **useEffect Cleanup**: Prevents memory leaks
- **Component Splitting**: Logical separation of concerns
- **State Management**: Efficient state updates

### **Network Optimizations**
- **Request Queuing**: Prevents rate limiting issues
- **Retry Logic**: Handles transient failures
- **Parallel Fetching**: Concurrent API calls where possible
- **Compression**: Automatic gzip compression

## 🚀 **Deployment Architecture**

### **Netlify Configuration**
- **Static Site**: React build artifacts
- **Serverless Functions**: CORS proxy for GE Tracker
- **Automatic HTTPS**: Built-in SSL certificate
- **CDN**: Global content delivery

### **Build Process**
```bash
npm run build    # TypeScript compilation + Vite build
npm run preview  # Local preview of production build
```

### **Environment Variables**
- **Development**: Uses Vite proxy for CORS
- **Production**: Uses Netlify functions
- **Automatic**: Environment detection via `import.meta.env.DEV`

## 🔧 **Development Workflow**

### **Local Development**
```bash
npm run dev      # Start development server (port 5176)
```

### **Code Quality**
```bash
npm run lint     # ESLint code quality checks
npm run build    # Production build with TypeScript compilation
```

### **Git Workflow**
```bash
git add -A       # Stage all changes
git commit -m "message"  # Commit with descriptive message
git push         # Push to GitHub (triggers Netlify deploy)
```

## 📋 **Configuration**

### **Application Constants** (`lib/constants.ts`)
```typescript
// Rate limiting
export const DEFAULT_RATE_LIMIT_MS = 150
export const DEFAULT_RETRIES = 3

// Cache TTLs
export const MAPPING_CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutes
export const LATEST_CACHE_TTL_MS = 60 * 1000        // 1 minute

// API endpoints
export const OSRS_PRICES_BASE = 'https://prices.runescape.wiki/api/v1/osrs'

// Business rules
export const MIN_OFFICIAL_GE_PRICE = 10_000
export const MIN_ROI = 1  // 1% minimum ROI
```

### **Vite Configuration** (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ge-tracker': {
        target: 'https://www.ge-tracker.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ge-tracker/, ''),
      },
    },
  },
})
```

## 🐛 **Troubleshooting Guide**

### **Common Issues**

#### **CORS Errors**
- **Development**: Ensure Vite proxy is configured correctly
- **Production**: Check Netlify function deployment
- **Solution**: Use serverless function instead of public proxies

#### **Cache Issues**
- **Stale Data**: Clear localStorage or wait for TTL expiration
- **Cache Corruption**: Check cache envelope structure
- **Solution**: Implement cache invalidation strategy

#### **API Failures**
- **Rate Limiting**: Check rate limit configuration
- **Network Issues**: Verify API endpoint availability
- **Solution**: Implement retry logic with exponential backoff

### **Debugging Tools**
- **Browser DevTools**: Network tab for API calls
- **Console**: Error messages and warnings
- **LocalStorage**: Cache inspection and management
- **Netlify Logs**: Serverless function debugging

## 🔮 **Future Enhancements**

### **Immediate Improvements**
1. **Unit Tests**: Add comprehensive test coverage
2. **Input Validation**: Enhance user input validation
3. **Error Boundaries**: Add granular error handling
4. **Performance**: Optimize bundle size and loading

### **Long-term Features**
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filtering**: More sophisticated filter options
3. **Export Functionality**: CSV/Excel export capabilities
4. **Historical Data**: Track ROI trends over time
5. **Mobile App**: React Native implementation

### **Infrastructure Improvements**
1. **Server-side Caching**: Redis or similar for better performance
2. **API Rate Limiting**: More sophisticated rate limiting
3. **Monitoring**: Application performance monitoring
4. **CI/CD**: Automated testing and deployment pipeline

## 📚 **API References**

### **OSRS Wiki Prices API**
- **Mapping**: `/api/v1/osrs/mapping` - Item metadata
- **Latest**: `/api/v1/osrs/latest` - Current prices
- **Rate Limit**: ~150ms between requests

### **GE Tracker**
- **Page**: `/deaths-coffer` - Death's Coffer item list
- **Format**: HTML table requiring parsing
- **CORS**: Requires proxy for browser access

### **OSRS Wiki API**
- **Endpoint**: `/api.php` - MediaWiki API
- **Usage**: Fetch ineligible item lists
- **Format**: JSON with pagination support

## 📞 **Support and Maintenance**

### **Monitoring**
- **Netlify Dashboard**: Build and function logs
- **Browser Analytics**: User behavior and performance
- **Error Tracking**: Application error monitoring

### **Maintenance Tasks**
- **Dependency Updates**: Regular package updates
- **API Changes**: Monitor for API endpoint changes
- **Performance**: Regular performance audits
- **Security**: Security audit and updates

---

**Document Version**: 1.0  
**Last Updated**: February 2, 2026  
**Maintainer**: Development Team  
**Contact**: GitHub Issues
