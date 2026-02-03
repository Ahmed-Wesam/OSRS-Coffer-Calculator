# OSRS Death's Coffer ROI Calculator

A web application that calculates and displays Return on Investment (ROI) for Death's Coffer items in Old School RuneScape, helping players identify profitable trading opportunities using official game APIs.

## Features

- **Official APIs**: Uses Jagex and OSRS Wiki APIs for accurate, real-time data
- **ROI Calculations**: Automatically calculates ROI percentages for Death's Coffer items
- **Progressive Loading**: Shows results as they're processed, no waiting
- **Advanced Filtering**: Filter by ROI percentage, buy price range
- **Responsive Design**: Clean, modern interface that works on all devices
- **Robust Error Handling**: Graceful degradation with enhanced retry logic
- **Smart Rate Limiting**: Optimized API calls with intelligent throttling

## Data Sources

- **Jagex API**: Official Grand Exchange prices for Death's Coffer calculations
- **OSRS Wiki API**: Item mappings, market prices, and trading limits
- **Smart Caching**: Optimized API calls with intelligent caching
- **No Third Parties**: Direct integration with official sources only

## Death's Coffer Formula

The application uses the verified formula:
- **Death's Coffer Value = Official GE Price × 1.05**
- **ROI = (Coffer Value - Buy Price) / Buy Price**
- **Buy Price**: Current market offer price from OSRS Wiki API

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Ahmed-Wesam/OSRS-Coffer-Calculator.git
cd OSRS-Coffer-Calculator
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Viewing ROI Data
- The table displays Death's Coffer items with positive ROI
- Columns include: Item name, buy price, official GE price, coffer value, ROI, and estimated volume
- Items are sorted by ROI (highest first)
- Results appear progressively as data is processed

### Filtering
- **Min ROI (%)**: Filter items by minimum ROI percentage
- **Min/Max Buy Price**: Set price range to filter items
- **Reset Filters**: Clear all filters to show all items

### Understanding the Data
- **ROI**: Calculated as (coffer value - buy price) / buy price
- **Volume**: Estimated daily trading volume (GE limit × 5)
- **Official GE**: Current Grand Exchange market price from Jagex API
- **Coffer Value**: Value received from Death's Coffer (GE price × 1.05)

## Development

### Running Tests
```bash
# Run all tests once
npx vitest run

# Run tests with coverage
npx vitest run --coverage
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Project Structure
```
src/
├── components/     # React components
├── lib/           # Utility functions and API calls
│   ├── api.ts     # Official API clients with retry logic
│   ├── officialApi.ts # Death's Coffer calculations
│   └── constants.ts # Application configuration
├── App.tsx        # Main application component
└── main.tsx       # Application entry point

tst/
└── unit/          # Unit tests
```

## API Integration

### Jagex API
- Fetches official Grand Exchange prices
- Enhanced retry logic with exponential backoff
- Rate limiting (2s between requests)
- Empty response detection and validation

### OSRS Wiki API
- Item mappings and metadata
- Current market offer prices (low/high)
- Grand Exchange trading limits
- Used for volume estimation and data validation

## Performance Features

### Smart Processing
- **Candidate Filtering**: Processes high-value items first
- **Top 100 Limit**: Prevents excessive API calls
- **Real-time Updates**: Shows results as they process
- **Progressive Loading**: No more waiting for completion

### Error Handling
- **8 Retries**: Exponential backoff (1s → 30s max)
- **Random Jitter**: Prevents thundering herd
- **Timeout Protection**: 5-minute maximum load time
- **Graceful Degradation**: Continues working when APIs fail

## Volume Data

Volume data is fetched directly from the OSRS Wiki API:
- **Data Source**: OSRS Wiki API 5-minute endpoint (`/api/v1/osrs/5m`)
- **Volume Calculation**: Math.max(highPriceVolume, lowPriceVolume)
- **Real Trading Data**: Maximum volume between buy and sell prices
- **Purpose**: Shows peak trading activity for each item

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **Vercel** - Hosting platform

## License

This project is licensed under the MIT License.
