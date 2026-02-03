# Testing Structure

This directory contains all tests for the OSRS GE Scraper project.

## Directory Structure

- `unit/` - Unit tests for individual functions and components
- `integration/` - Integration tests for module interactions
- `e2e/` - End-to-end tests for full user workflows

## Unit Tests

Unit tests focus on testing individual pieces of functionality in isolation:

- **API functions** (`tst/unit/api.test.ts`) - Test data fetching, caching, and error handling
- **Utility functions** (`tst/unit/utils.test.ts`) - Test input parsing and formatting
- **Components** (`tst/unit/components/`) - Test React components with mocked dependencies
- **Data processing** (`tst/unit/geTracker.test.ts`) - Test HTML parsing and data transformation

## Running Tests

```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test -- --watch
```

## Testing Philosophy

- Focus on meaningful business logic, not implementation details
- Mock external dependencies (fetch, localStorage, APIs)
- Test error conditions and edge cases
- Keep tests simple and readable
