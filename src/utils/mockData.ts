export interface Donor {
  id: number
  name: string
  amount: number
  created_at: string
  avatar?: string
}

export const MOCK_DONORS: Donor[] = [
  { id: 1, name: 'Elon M.', amount: 9999, created_at: '2025-03-01T12:00:00Z' },
  { id: 2, name: 'CryptoWhale🐋', amount: 5000, created_at: '2025-03-02T09:30:00Z' },
  { id: 3, name: 'MarsColonist', amount: 2500, created_at: '2025-03-03T14:20:00Z' },
  { id: 4, name: '火星第一批移民', amount: 1000, created_at: '2025-03-04T11:00:00Z' },
  { id: 5, name: 'DeepSpaceDAO', amount: 888, created_at: '2025-03-05T16:45:00Z' },
  { id: 6, name: 'SatoshiNakamoto', amount: 500, created_at: '2025-03-06T08:00:00Z' },
  { id: 7, name: 'NebulaDrifter', amount: 420, created_at: '2025-03-07T20:00:00Z' },
  { id: 8, name: '宇宙探险家', amount: 300, created_at: '2025-03-08T10:30:00Z' },
  { id: 9, name: 'StarshipPilot99', amount: 250, created_at: '2025-03-09T15:00:00Z' },
  { id: 10, name: 'GalacticVC', amount: 200, created_at: '2025-03-10T13:00:00Z' },
  { id: 11, name: 'ZeroGravity', amount: 168, created_at: '2025-03-11T11:11:00Z' },
  { id: 12, name: 'OrbitCatcher', amount: 100, created_at: '2025-03-12T09:00:00Z' },
  { id: 13, name: 'Voyager2025', amount: 88, created_at: '2025-03-13T14:14:00Z' },
  { id: 14, name: 'LunarMaxi', amount: 50, created_at: '2025-03-14T07:00:00Z' },
  { id: 15, name: 'CosmicDreamer', amount: 28, created_at: '2025-03-15T19:30:00Z' },
]
