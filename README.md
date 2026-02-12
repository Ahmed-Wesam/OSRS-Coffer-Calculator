# OSRS Death's Coffer ROI Calculator

A modern, type-safe web application that calculates and displays Return on Investment (ROI) for Death's Coffer items in Old School RuneScape, helping players identify profitable trading opportunities using official game APIs.

## 🚀 Features

- **Official APIs**: Uses Jagex and OSRS Wiki APIs for accurate, real-time data
- **ROI Calculations**: Automatically calculates ROI percentages for Death's Coffer items
- **Blob Storage**: Pre-computed data with intelligent caching for instant loading
- **Advanced Filtering**: Filter by ROI percentage, buy price range
- **Responsive Design**: Clean, modern interface that works on all devices
- **Type-Safe Architecture**: 100% TypeScript with comprehensive type definitions
- **Robust Error Handling**: Graceful degradation with enhanced retry logic
- **Smart Rate Limiting**: Optimized API calls with intelligent throttling

## 📊 Data Sources

- **Jagex API**: Official Grand Exchange prices for Death's Coffer calculations
- **OSRS Wiki API**: Item mappings, market prices, and trading limits
- **Blob Storage**: Pre-computed data with automatic updates via cron jobs
- **Smart Caching**: Optimized API calls with intelligent caching
- **No Third Parties**: Direct integration with official sources only

## 🧮 Death's Coffer Formula

The application uses the verified formula:
- **Death's Coffer Value = Official GE Price × 1.05**
- **ROI = (Coffer Value - Buy Price) / Buy Price**
- **Buy Price**: Current market offer price from OSRS Wiki API

## 🏗️ Architecture

### Modern Type-Safe Design
```
src/
├── core/                           # Core architecture layer
│   ├── types/                     # Type definitions
│   │   ├── api.types.ts          # API request/response types
│   │   ├── domain.types.ts       # Business domain types
│   │   ├── ui.types.ts           # UI component types
│   │   ├── errors.types.ts        # Error handling types
│   │   └── index.ts              # Barrel exports
│   ├── interfaces/               # Interface definitions
│   ├── repositories.ts        # Data access interfaces
│   ├── services.ts           # Business service interfaces
│   ├── adapters.ts          # External system adapters
│   └── index.ts              # Barrel exports
│   ├── constants/                # Application constants
│   ├── api.endpoints.ts      # API endpoint definitions
│   ├── app.constants.ts      # Application configuration
│   ├── ui.constants.ts       # UI design constants
│   └── index.ts              # Barrel export
│   └── index.ts                  # Main barrel export
├── lib/                          # Business logic and utilities
│   ├── blobStorageApi.ts        # Blob storage API client
│   ├── api.ts                   # External API integrations
│   ├── security.ts              # Security middleware
│   ├── types.ts                 # Shared type definitions
│   ├── mockData.ts              # Development mock data
│   └── utils.ts                 # Utility functions
├── App.tsx                       # Main application component
└── main.tsx                     # Application entry point
```

### Key Architectural Patterns
- **Repository Pattern**: Clean data access abstraction
- **Service Layer**: Business logic separation
- **Adapter Pattern**: External system integration
- **Error Handling**: Comprehensive error hierarchy with recovery
- **Type Safety**: 100% TypeScript coverage with strict mode

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone repository
```bash
git clone https://github.com/Ahmed-Wesam/OSRS-Coffer-Calculator.git
cd OSRS-Coffer-Calculator
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Start development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📖 Usage

### Viewing ROI Data
- The table displays Death's Coffer items with positive ROI
- Columns include: Item name, buy price, official GE price, coffer value, ROI, and volume
- Items are sorted by ROI (highest first)
- Real-time data with timestamp display

### Filtering
- **Min ROI (%)**: Filter items by minimum ROI percentage
- **Min/Max Buy Price**: Set price range to filter items
- **Search**: Search items by name
- **Reset Filters**: Clear all filters to show all items

### Understanding the Data
- **ROI**: Calculated as (coffer value - buy price) / buy price
- **Volume**: Estimated daily trading volume
- **Official GE**: Current Grand Exchange market price from Jagex API
- **Coffer Value**: Value received from Death's Coffer (GE price × 1.05)
- **Last Updated**: Shows when the data was generated

## 🛠️ Development

### Running Tests
```bash
# Run all tests once
npx vitest run

# Run tests with coverage
npx vitest run --coverage

# Run tests in watch mode
npx vitest
```

### Code Quality
```bash
# Lint code
npm run lint

# Type check
npm run build

# Format code
npm run format
```

### Building for Production
```bash
npm run build
```

## 🔧 API Integration

### Blob Storage (Primary)
- **Pre-computed Data**: All calculations done server-side
- **Instant Loading**: No API delays for users
- **Automatic Updates**: Cron jobs refresh data every few hours
- **Fallback Support**: Graceful degradation when data is unavailable

### Jagex API (Background)
- **Official Grand Exchange prices**
- **Enhanced retry logic with exponential backoff**
- **Rate limiting (1.2s between requests)**
- **Empty response detection and validation**

### OSRS Wiki API (Background)
- **Item mappings and metadata**
- **Current market offer prices (low/high)**
- **Grand Exchange trading limits**
- **Used for volume estimation and data validation**

## ⚡ Performance Features

### Smart Processing
- **Pre-computed Data**: All calculations done in background
- **Instant Loading**: No waiting for API responses
- **Intelligent Caching**: TTL-based caching with appropriate expiration
- **Progressive Loading**: Results appear instantly

### Error Handling
- **Comprehensive Error Types**: Hierarchical error system
- **Retry Logic**: Exponential backoff with jitter
- **Timeout Protection**: 45-second maximum load time
- **Graceful Degradation**: Continues working when APIs fail

## 📚 Technical Documentation

### Core Architecture
- **Type System**: Comprehensive type definitions for all layers
- **Error Handling**: Structured error hierarchy with recovery patterns
- **Constants Management**: Centralized configuration and endpoints
- **Interface Contracts**: Clear separation between layers

### Development Patterns
- **Repository Pattern**: Clean data access abstraction
- **Service Layer**: Business logic encapsulation
- **Adapter Pattern**: External system integration
- **Factory Pattern**: Error and object creation

## 🔄 Refactoring Progress

### ✅ Phase 1: Foundation Layer (Completed)
1. **Core Architecture**: Types, interfaces, and constants
2. **Error Handling**: Comprehensive error system
3. **Naming Consistency**: Blob storage conventions throughout

### 🚧 Phase 2: Data Layer (In Progress)
1. **Repository Pattern**: Data access layer implementation
2. **Service Layer**: Business logic abstraction
3. **API Client Refactoring**: Base client with retry, Jagex/Wiki clients

### 📋 Phase 3: Business Logic Layer (Planned)
1. **Domain Models**: Item, Death's Coffer, ROI entities, value objects
2. **Business Rules Engine**: Eligibility, filtering, validation rules

### 📋 Phase 4: Presentation Layer (Planned)
1. **Component Library**: Reusable UI components
2. **State Management**: Custom hooks, stores, context providers

### 📋 Phase 5: Backend Architecture (Planned)
1. **Backend Refactoring**: Controllers, services, middleware
2. **Scraping Separation**: Scrapers, processors, validators

### 📋 Phase 6: Testing & Documentation (Planned)
1. **Comprehensive Testing**: Unit, integration, E2E, performance, accessibility
2. **Documentation**: API docs, architecture docs, component docs

## 🎯 Success Metrics

### Code Quality Metrics
- **Type Coverage**: Maintain 100% TypeScript coverage
- **Test Coverage**: Achieve 90%+ test coverage
- **Lint Score**: Maintain 0 ESLint errors
- **Build Time**: Keep under 1 minute
- **Bundle Size**: Optimize under 200KB

### Performance Metrics
- **Load Time**: Instant loading with blob storage
- **API Response**: < 2 seconds for all endpoints
- **Error Rate**: < 1% for all operations
- **Uptime**: 99.9% availability
- **Cache Hit Rate**: > 95%

### Developer Experience Metrics
- **Setup Time**: < 5 minutes for new developers
- **Build Time**: < 30 seconds for development builds
- **Documentation**: Complete coverage of all APIs
- **Type Safety**: Full IntelliSense support
- **Debugging**: Clear error messages and stack traces

### User Experience Metrics
- **Page Load**: < 2 seconds for initial load
- **Data Freshness**: < 4 hours old
- **Error Recovery**: Graceful degradation with fallbacks
- **Mobile Responsive**: Works on all devices
- **Accessibility**: WCAG 2.1 compliant

## 🚀 Technical Debt Resolution

### Resolved Issues ✅
- **Type Safety**: 100% TypeScript coverage
- **Error Handling**: Comprehensive error system
- **Naming Consistency**: Unified blob storage conventions
- **Architecture**: Clean separation of concerns
- **Code Organization**: Proper file structure and exports
- **API Response Format**: Fixed mismatched response structure
- **Race Conditions**: Improved timeout handling with try/finally
- **Input Validation**: Added proper request validation
- **Security**: Enhanced error response structure
- **Comment Cleanup**: Removed AI-generated comments, kept human insights

### Current Technical Debt 📋
- **Utility Functions**: Scattered formatting functions
- **Component Duplication**: Repeated UI patterns
- **Test Coverage**: Limited test coverage
- **State Management**: Basic React state only
- **Documentation**: Some outdated documentation

### Future Improvements 🔮
- **Microservices**: Consider service separation
- **Real-time Updates**: WebSocket integration
- **Mobile App**: React Native application
- **Analytics**: User behavior tracking
- **Internationalization**: Multi-language support

## 📈 Performance Optimizations

### Current Optimizations ✅
- **Blob Storage**: Pre-computed data for instant loading
- **Rate Limiting**: Intelligent API throttling
- **Caching**: TTL-based caching strategies
- **Error Recovery**: Graceful degradation
- **Type Safety**: Compile-time error prevention
- **API Cleanup**: Streamlined endpoint surface

### Planned Optimizations 📋
- **Code Splitting**: Lazy loading for better performance
- **Service Workers**: Offline functionality
- **Image Optimization**: WebP format and lazy loading
- **Bundle Analysis**: Regular bundle optimization
- **Performance Monitoring**: Real-time performance tracking

## 🔒 Security Considerations

### Current Security Measures ✅
- **Input Validation**: Sanitization of all user inputs
- **Rate Limiting**: API abuse prevention
- **Environment Variables**: Secure secret management
- **HTTPS Enforcement**: Secure data transmission
- **CORS Configuration**: Proper cross-origin settings
- **Request Method Validation**: Only allowed methods
- **Error Response Sanitization**: No internal error exposure

### Security Enhancements 📋
- **Content Security Policy**: Additional XSS protection
- **Dependency Scanning**: Regular vulnerability checks
- **API Authentication**: Token-based authentication
- **Audit Logging**: Security event tracking
- **Penetration Testing**: Regular security assessments

## 🌟 Long-term Vision

### Technical Goals
- **Scalability**: Handle 10x current user base
- **Reliability**: 99.99% uptime target
- **Performance**: Sub-second response times
- **Maintainability**: Easy onboarding for developers
- **Extensibility**: Plugin architecture for features

### Business Goals
- **User Experience**: Best-in-class ROI calculator
- **Data Accuracy**: Most reliable OSRS data source
- **Community**: Active OSRS community engagement
- **Innovation**: Leading-edge features and integrations
- **Education**: Educational content for OSRS players

## 📊 Recent Changes

### API Cleanup (Latest)
- **Removed Endpoints**: Eliminated `/api/blob-simple` and `/api/update-blob-config`
- **Streamlined Client**: Only `fetchBlobStorageDeathsCofferRows` exposed to users
- **Fixed Response Format**: Corrected API response structure to match `BlobStorageResponse` type
- **Enhanced Validation**: Added JSON validation and response structure checks
- **Improved Error Handling**: Better error messages and structured responses
- **Security Hardening**: Added request method validation and security headers
- **Comment Cleanup**: Removed AI-generated comments, kept human insights

### Code Review Fixes (Latest)
- **Type Mismatch**: Fixed API response structure vs expected type
- **Race Conditions**: Improved timeout handling with try/finally
- **Input Validation**: Added request method validation
- **Error Responses**: Structured error responses with codes and timestamps
- **Mock Data**: Updated mock data to match type structure
- **Security**: Enhanced error response sanitization
- **Comment Cleanup**: Removed AI-like comments, kept human-written ones

### Documentation Updates (Latest)
- **README.md**: Completely revamped with current architecture and progress
- **Roadmap**: Updated with completed phases and current status
- **Architecture Docs**: Comprehensive technical documentation
- **API Docs**: Complete API reference with examples
- **Development Guide**: Detailed setup and contribution guide
- **Comment Cleanup**: Removed AI-generated comments, kept human insights

---

*This roadmap is a living document that will be updated as we progress through the refactoring phases. The focus is on building a maintainable, scalable, and developer-friendly application while preserving the core functionality that users love.*

**Last Updated**: February 2026
**Next Review**: End of Phase 2
