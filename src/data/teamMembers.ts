export interface TeamMember {
  id: string
  name: string
  role: string
  initials: string
  /** Home office / branch code for the advisor (demo). */
  officeCode: string
  /** Team or pod identifier (demo). */
  teamCode: string
  /** Registered rep / advisor code (demo). */
  rrCode: string
}

export const teamMembers: TeamMember[] = [
  { id: 'alice-chen', name: 'Alice Chen', role: 'Relationship Manager', initials: 'AC', officeCode: '1001', teamCode: '4402', rrCode: '10442' },
  { id: 'bob-martinez', name: 'Bob Martinez', role: 'Relationship Manager', initials: 'BM', officeCode: '1002', teamCode: '4403', rrCode: '21890' },
  { id: 'carol-williams', name: 'Carol Williams', role: 'Compliance Officer', initials: 'CW', officeCode: '2001', teamCode: '9100', rrCode: '33001' },
  { id: 'diana-torres', name: 'Diana Torres', role: 'Operations', initials: 'DT', officeCode: '1003', teamCode: '7701', rrCode: '44112' },
  { id: 'edward-kim', name: 'Edward Kim', role: 'Relationship Manager', initials: 'EK', officeCode: '1004', teamCode: '4405', rrCode: '55223' },
]
