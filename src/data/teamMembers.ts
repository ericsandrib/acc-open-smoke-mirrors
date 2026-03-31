export interface TeamMember {
  id: string
  name: string
  role: string
  initials: string
}

export const teamMembers: TeamMember[] = [
  { id: 'alice-chen', name: 'Alice Chen', role: 'Relationship Manager', initials: 'AC' },
  { id: 'bob-martinez', name: 'Bob Martinez', role: 'Relationship Manager', initials: 'BM' },
  { id: 'carol-williams', name: 'Carol Williams', role: 'Compliance Officer', initials: 'CW' },
  { id: 'diana-torres', name: 'Diana Torres', role: 'Operations', initials: 'DT' },
  { id: 'edward-kim', name: 'Edward Kim', role: 'Relationship Manager', initials: 'EK' },
]
