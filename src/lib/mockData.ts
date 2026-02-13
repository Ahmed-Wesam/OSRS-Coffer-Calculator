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
  totalItems: 10,
  items: [
    {
      id: 4722,
      name: 'Dragon bones',
      buyPrice: 2500,
      officialGePrice: 3200,
      cofferValue: 3360,
      roi: 0.344,
      lowPriceVolume: 4500
    },
    {
      id: 4151,
      name: 'Abyssal whip',
      buyPrice: 1200000,
      officialGePrice: 1326723,
      cofferValue: 1393061,
      roi: 0.1609,
      lowPriceVolume: 12
    },
    {
      id: 536,
      name: 'Dragon bones',
      buyPrice: 3000,
      officialGePrice: 3200,
      cofferValue: 3360,
      roi: 0.12,
      lowPriceVolume: 4500
    },
    {
      id: 561,
      name: 'Runite ore',
      buyPrice: 11000,
      officialGePrice: 12500,
      cofferValue: 13125,
      roi: 0.193,
      lowPriceVolume: 1200
    },
    {
      id: 2361,
      name: 'Shield left half',
      buyPrice: 650000,
      officialGePrice: 720000,
      cofferValue: 756000,
      roi: 0.163,
      lowPriceVolume: 45
    },
    {
      id: 1187,
      name: 'Dragon scimitar',
      buyPrice: 1800000,
      officialGePrice: 2100000,
      cofferValue: 2205000,
      roi: 0.225,
      lowPriceVolume: 8
    },
    {
      id: 13263,
      name: 'Abyssal bludgeon',
      buyPrice: 18000000,
      officialGePrice: 18133766,
      cofferValue: 19040454,
      roi: 0.055,
      lowPriceVolume: 2
    },
    {
      id: 13271,
      name: 'Abyssal dagger (p++)',
      buyPrice: 2086426,
      officialGePrice: 2100000,
      cofferValue: 2205000,
      roi: 0.057,
      lowPriceVolume: 6
    },
    {
      id: 4708,
      name: "Ahrim's hood",
      buyPrice: 355899,
      officialGePrice: 47088,
      cofferValue: 494424,
      roi: 0.390,
      lowPriceVolume: 2
    },
    {
      id: 4714,
      name: "Ahrim's robeskirt",
      buyPrice: 1751487,
      officialGePrice: 1751487,
      cofferValue: 1839061,
      roi: 0.050,
      lowPriceVolume: 4
    }
  ]
}
