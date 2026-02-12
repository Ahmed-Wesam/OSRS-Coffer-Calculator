import type { BlobStorageResponse } from './types'

const mockTimestamp = '2024-01-15T14:30:00.000Z'

export const mockBlobStorageResponse: BlobStorageResponse = {
  timestamp: mockTimestamp,
  date: '2024-01-15',
  isFallback: false,
  sourceFiles: [
    {
      filename: 'items-2024-01-15.json',
      timestamp: mockTimestamp,
      itemCount: 3
    }
  ],
  totalItems: 3,
  items: [
    {
      id: 4722,
      name: 'Dragon bones',
      buyPrice: 2500,
      officialGePrice: 3200,
      cofferValue: 3360,
      roi: 0.344,
      volume: 8000
    },
    {
      id: 4151,
      name: 'Dragon bones',
      buyPrice: 2800,
      officialGePrice: 3200,
      cofferValue: 3360,
      roi: 0.2,
      volume: 8000
    },
    {
      id: 536,
      name: 'Dragon bones',
      buyPrice: 3000,
      officialGePrice: 3200,
      cofferValue: 3360,
      roi: 0.12,
      volume: 8000
    }
  ]
}
