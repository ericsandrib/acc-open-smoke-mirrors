export interface ViewFilter {
  column: string
  operator: 'equals' | 'includes' | 'contains'
  value: string | string[]
}

export interface ViewPreset {
  id: string
  name: string
  category: 'pinned' | 'personal' | 'global'
  isDefault?: boolean
  filters: ViewFilter[]
  visibleColumns: string[]
  sortBy?: {
    column: string
    direction: 'asc' | 'desc'
  }
}

export interface ColumnDef {
  key: string
  label: string
  alwaysVisible?: boolean
  filterable?: 'multi-select' | 'text'
}
