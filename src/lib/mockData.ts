// Mock data for local development
export const mockBlobStorageResponse = {
  timestamp: new Date().toISOString(),
  date: new Date().toISOString().split('T')[0],
  isFallback: false,
  sourceFiles: [
    {
      filename: 'items-2024-01-15.json',
      timestamp: new Date().toISOString(),
      itemCount: 100
    }
  ],
  totalItems: 3,
  items: [
    {
      id: 4722,
      name: 'Dragon bones',
      buyPrice: 2500,
      officialGePrice: 2800,
      cofferValue: 2940,
      roi: 0.176,
      volume: 5000
    },
    {
      id: 536,
      name: 'Death rune',
      buyPrice: 300,
      officialGePrice: 350,
      cofferValue: 367,
      roi: 0.223,
      volume: 10000
    },
    {
      id: 562,
      name: 'Law rune',
      buyPrice: 280,
      officialGePrice: 320,
      cofferValue: 336,
      roi: 0.2,
      volume: 8000
    }
  ]
}
