export interface Donor {
  id: number
  name: string
  amount: number
  created_at: string
  avatar?: string
}

export const MOCK_DONORS: Donor[] = [
  { id: 1, name: 'Ava L. / Paris', amount: 220, created_at: '2026-03-09T12:00:00Z' },
  { id: 2, name: 'Noah B. / Montreal', amount: 180, created_at: '2026-03-10T09:30:00Z' },
  { id: 3, name: 'Lina K. / Singapore', amount: 150, created_at: '2026-03-11T14:20:00Z' },
  { id: 4, name: 'Wei T. / Taipei', amount: 120, created_at: '2026-03-12T11:00:00Z' },
  { id: 5, name: 'Camille R. / Lyon', amount: 88, created_at: '2026-03-13T16:45:00Z' },
  { id: 6, name: 'Omar A. / Dubai', amount: 72, created_at: '2026-03-14T08:00:00Z' },
  { id: 7, name: 'Rafael C. / Sao Paulo', amount: 66, created_at: '2026-03-15T20:00:00Z' },
  { id: 8, name: 'Mia S. / London', amount: 54, created_at: '2026-03-16T10:30:00Z' },
  { id: 9, name: 'Jules M. / Marseille', amount: 42, created_at: '2026-03-17T15:00:00Z' },
  { id: 10, name: 'Leo V. / Brussels', amount: 36, created_at: '2026-03-18T13:00:00Z' },
  { id: 11, name: 'Iris P. / Seoul', amount: 25, created_at: '2026-03-19T11:11:00Z' },
  { id: 12, name: 'Nora H. / Berlin', amount: 18, created_at: '2026-03-20T09:00:00Z' },
]
