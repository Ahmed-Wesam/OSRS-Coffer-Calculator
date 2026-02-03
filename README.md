# OSRS Death's Coffer ROI Calculator

A web application that calculates and displays Return on Investment (ROI) for Death's Coffer items in Old School RuneScape, helping players identify profitable trading opportunities.

## Features

- **Real-time Data**: Fetches data from GE Tracker and OSRS Wiki API
- **ROI Calculations**: Automatically calculates ROI percentages for Death's Coffer items
- **Volume Estimates**: Displays estimated trade volume based on GE limits
- **Advanced Filtering**: Filter by ROI percentage, buy price range
- **Responsive Design**: Clean, modern interface that works on all devices
- **Data Validation**: Filters out ineligible items and ensures data quality

## Data Sources

- **GE Tracker**: Death's Coffer item list and current market data
- **OSRS Wiki API**: Item mappings, prices, and trading limits
- **Smart Caching**: Optimized API calls with intelligent caching

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
- The table displays all Death's Coffer items with positive ROI
- Columns include: Item name, buy price, official GE price, coffer value, ROI, and estimated volume
- Items are sorted by ROI (highest first)

### Filtering
- **Min ROI (%)**: Filter items by minimum ROI percentage
- **Min/Max Buy Price**: Set price range to filter items
- **Reset Filters**: Clear all filters to show all items

### Understanding the Data
- **ROI**: Calculated as (coffer value - buy price) / buy price
- **Volume**: Estimated daily trading volume (GE limit × 5)
- **Official GE**: Current Grand Exchange market price
- **Coffer Value**: Value received from Death's Coffer

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
├── App.tsx        # Main application component
└── main.tsx       # Application entry point

tst/
└── unit/          # Unit tests

api/
└── ge-tracker.js  # Vercel API proxy
```

## API Integration

### GE Tracker API
- Fetches Death's Coffer item list
- Provides current market prices and coffer values
- Accessed via Vercel API proxy in production

### OSRS Wiki API
- Item mappings and metadata
- Grand Exchange trading limits
- Current market prices
- Used for volume estimation and data validation

## Volume Estimation

Since real volume data isn't available from public APIs, volume is estimated as:
- **Formula**: GE Buy Limit × 5
- **Rationale**: Popular items typically trade 5-10x their daily limit
- **Purpose**: Provides relative trading activity context

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
- **Vercel** - Hosting and API proxy

## License

This project is licensed under the MIT License.
