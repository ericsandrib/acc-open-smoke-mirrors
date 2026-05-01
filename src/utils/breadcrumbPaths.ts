export type BreadcrumbPathType =
  | 'canonical'
  | 'contextual'
  | 'database'
  | 'relation'
  | 'alias'

export interface BreadcrumbPage {
  id: string
  title?: string | null
  parentId: string | null
}

export interface BreadcrumbItem {
  id: string
  label: string
  missing?: boolean
}

export interface BreadcrumbPath {
  id: string
  label: string
  items: BreadcrumbItem[]
  type: BreadcrumbPathType
  isCurrent: boolean
  partial?: boolean
}

export interface BreadcrumbContext {
  contextId?: string
  sourcePageId?: string
  sourceBlockId?: string
  databaseViewId?: string
  relationPath?: string[]
  aliasReferenceBlockId?: string
  /**
   * Optional explicit path preserved from user entry point.
   * This should be ancestor ids (may or may not include current page id).
   */
  entryPathPageIds?: string[]
}

export interface BreadcrumbRenderModel {
  visibleItems: BreadcrumbItem[]
  hiddenItems: BreadcrumbItem[]
  hasEllipsis: boolean
}

type ResolvePathResult = {
  items: BreadcrumbItem[]
  ids: string[]
  partial: boolean
}

function normalizeTitle(title: string | null | undefined): string {
  const value = (title ?? '').trim()
  return value.length > 0 ? value : 'Untitled'
}

function resolveCanonicalPath(
  pageId: string,
  pagesById: Record<string, BreadcrumbPage>,
): ResolvePathResult {
  const visited = new Set<string>()
  const reverseIds: string[] = []
  const reverseItems: BreadcrumbItem[] = []
  let partial = false
  let cursor: string | null = pageId

  while (cursor) {
    if (visited.has(cursor)) {
      partial = true
      break
    }
    visited.add(cursor)
    const page: BreadcrumbPage | undefined = pagesById[cursor]
    if (!page) {
      reverseIds.push(`missing:${cursor}`)
      reverseItems.push({ id: `missing:${cursor}`, label: 'Missing page', missing: true })
      partial = true
      break
    }
    reverseIds.push(page.id)
    reverseItems.push({ id: page.id, label: normalizeTitle(page.title) })
    cursor = page.parentId
  }

  return {
    ids: reverseIds.reverse(),
    items: reverseItems.reverse(),
    partial,
  }
}

function inferContextPathType(context: BreadcrumbContext): BreadcrumbPathType {
  if (context.relationPath && context.relationPath.length > 0) return 'relation'
  if (context.databaseViewId) return 'database'
  if (context.aliasReferenceBlockId || context.sourceBlockId) return 'alias'
  return 'contextual'
}

function inferContextLabel(context: BreadcrumbContext): string {
  if (context.databaseViewId) return `Opened from view ${context.databaseViewId}`
  if (context.relationPath && context.relationPath.length > 0) return 'Related via relation'
  if (context.aliasReferenceBlockId) return `Opened from alias ${context.aliasReferenceBlockId}`
  if (context.sourcePageId) return `Opened from ${context.sourcePageId}`
  return 'Opened from context'
}

function resolveContextualPath(
  pageId: string,
  pagesById: Record<string, BreadcrumbPage>,
  context: BreadcrumbContext,
): ResolvePathResult | null {
  const base =
    context.entryPathPageIds && context.entryPathPageIds.length > 0
      ? [...context.entryPathPageIds]
      : context.relationPath && context.relationPath.length > 0
        ? [...context.relationPath]
        : context.sourcePageId
          ? resolveCanonicalPath(context.sourcePageId, pagesById).ids
          : []

  if (base.length === 0) return null

  const pathIds = [...base]
  if (pathIds[pathIds.length - 1] !== pageId) {
    pathIds.push(pageId)
  }

  const visited = new Set<string>()
  const items: BreadcrumbItem[] = []
  const ids: string[] = []
  let partial = false

  for (const id of pathIds) {
    if (visited.has(id)) {
      partial = true
      break
    }
    visited.add(id)
    const page: BreadcrumbPage | undefined = pagesById[id]
    if (!page) {
      items.push({ id: `missing:${id}`, label: 'Missing page', missing: true })
      ids.push(`missing:${id}`)
      partial = true
      break
    }
    items.push({ id: page.id, label: normalizeTitle(page.title) })
    ids.push(page.id)
  }

  return { items, ids, partial }
}

export function getBreadcrumbPath(
  pageId: string,
  pagesById: Record<string, BreadcrumbPage>,
): BreadcrumbItem[] {
  return resolveCanonicalPath(pageId, pagesById).items
}

export function getBreadcrumbPaths(
  pageId: string,
  pagesById: Record<string, BreadcrumbPage>,
  context?: BreadcrumbContext | null,
): BreadcrumbPath[] {
  const paths: BreadcrumbPath[] = []
  const canonical = resolveCanonicalPath(pageId, pagesById)

  if (context) {
    const contextual = resolveContextualPath(pageId, pagesById, context)
    if (contextual && contextual.items.length > 0) {
      paths.push({
        id: `context:${context.contextId ?? 'default'}`,
        label: inferContextLabel(context),
        items: contextual.items,
        type: inferContextPathType(context),
        isCurrent: true,
        partial: contextual.partial,
      })
    }
  }

  paths.push({
    id: 'canonical',
    label: 'Canonical location',
    items: canonical.items,
    type: 'canonical',
    isCurrent: paths.length === 0,
    partial: canonical.partial,
  })

  const unique: BreadcrumbPath[] = []
  const seen = new Set<string>()
  for (const path of paths) {
    const key = path.items.map((i) => i.id).join('>')
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(path)
  }

  if (unique.length > 0) {
    let currentSet = false
    for (const path of unique) {
      const shouldBeCurrent = !currentSet && path.type !== 'canonical'
      path.isCurrent = shouldBeCurrent
      if (shouldBeCurrent) currentSet = true
    }
    if (!currentSet) unique[0].isCurrent = true
  }

  return unique
}

export function canMovePage(
  pageId: string,
  newParentId: string | null,
  pagesById: Record<string, BreadcrumbPage>,
): boolean {
  if (!pagesById[pageId]) return false
  if (newParentId === pageId) return false
  if (newParentId == null) return true
  if (!pagesById[newParentId]) return false

  const visited = new Set<string>()
  let cursor: string | null = newParentId
  while (cursor) {
    if (visited.has(cursor)) return false
    if (cursor === pageId) return false
    visited.add(cursor)
    cursor = pagesById[cursor]?.parentId ?? null
  }
  return true
}

export function movePage(
  pageId: string,
  newParentId: string | null,
  pagesById: Record<string, BreadcrumbPage>,
): void {
  const page = pagesById[pageId]
  if (!page) return
  if (!canMovePage(pageId, newParentId, pagesById)) return
  pagesById[pageId] = { ...page, parentId: newParentId }
}

export function collapseBreadcrumbs(
  items: BreadcrumbItem[],
  maxVisible: number,
): BreadcrumbRenderModel {
  if (maxVisible <= 0 || items.length === 0) {
    return { visibleItems: [], hiddenItems: items, hasEllipsis: items.length > 0 }
  }
  if (items.length <= maxVisible) {
    return { visibleItems: items, hiddenItems: [], hasEllipsis: false }
  }

  if (maxVisible === 1) {
    return {
      visibleItems: [items[items.length - 1]],
      hiddenItems: items.slice(0, -1),
      hasEllipsis: true,
    }
  }

  const tailCount = Math.max(1, maxVisible - 2)
  const visibleItems = [items[0], ...items.slice(items.length - tailCount)]
  const hiddenItems = items.slice(1, items.length - tailCount)
  return { visibleItems, hiddenItems, hasEllipsis: hiddenItems.length > 0 }
}
