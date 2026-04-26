import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canMovePage,
  collapseBreadcrumbs,
  getBreadcrumbPath,
  getBreadcrumbPaths,
  movePage,
  type BreadcrumbPage,
} from '../src/utils/breadcrumbPaths'

function seedPages(): Record<string, BreadcrumbPage> {
  return {
    root: { id: 'root', title: 'Workspace', parentId: null },
    a: { id: 'a', title: 'A', parentId: 'root' },
    b: { id: 'b', title: 'B', parentId: 'a' },
    c: { id: 'c', title: 'C', parentId: 'b' },
    db: { id: 'db', title: 'Database', parentId: 'root' },
    row: { id: 'row', title: 'Row 1', parentId: 'db' },
    relHost: { id: 'relHost', title: 'Deals', parentId: 'root' },
    aliasHost: { id: 'aliasHost', title: 'Weekly Notes', parentId: 'root' },
    untitled: { id: 'untitled', title: '', parentId: 'root' },
  }
}

test('simple root page', () => {
  const pages = seedPages()
  const items = getBreadcrumbPath('root', pages)
  assert.deepEqual(items.map((i) => i.id), ['root'])
})

test('3-level nested page', () => {
  const pages = seedPages()
  const items = getBreadcrumbPath('c', pages)
  assert.deepEqual(items.map((i) => i.id), ['root', 'a', 'b', 'c'])
})

test('deeply nested page with collapsed breadcrumbs', () => {
  const pages = seedPages()
  pages.d = { id: 'd', title: 'D', parentId: 'c' }
  pages.e = { id: 'e', title: 'E', parentId: 'd' }
  const items = getBreadcrumbPath('e', pages)
  const collapsed = collapseBreadcrumbs(items, 4)
  assert.equal(collapsed.hasEllipsis, true)
  assert.deepEqual(collapsed.visibleItems.map((i) => i.id), ['root', 'c', 'd', 'e'])
  assert.deepEqual(collapsed.hiddenItems.map((i) => i.id), ['a', 'b'])
})

test('moving a page updates breadcrumb path', () => {
  const pages = seedPages()
  movePage('b', 'root', pages)
  const items = getBreadcrumbPath('c', pages)
  assert.deepEqual(items.map((i) => i.id), ['root', 'b', 'c'])
})

test('moving page into descendant is rejected', () => {
  const pages = seedPages()
  assert.equal(canMovePage('a', 'c', pages), false)
  movePage('a', 'c', pages)
  assert.equal(pages.a.parentId, 'root')
})

test('linked/reference context does not change canonical path', () => {
  const pages = seedPages()
  const canonical = getBreadcrumbPath('c', pages).map((i) => i.id)
  const paths = getBreadcrumbPaths('c', pages, {
    contextId: 'ctx1',
    sourcePageId: 'aliasHost',
    aliasReferenceBlockId: 'blk-12',
  })
  const canonicalPath = paths.find((p) => p.type === 'canonical')
  assert.ok(canonicalPath)
  assert.deepEqual(canonicalPath!.items.map((i) => i.id), canonical)
})

test('cycle detection does not crash', () => {
  const pages = seedPages()
  pages.a.parentId = 'c'
  const items = getBreadcrumbPath('c', pages)
  assert.ok(items.length > 0)
})

test('missing parent produces partial breadcrumb safely', () => {
  const pages = seedPages()
  pages.b.parentId = 'deleted-parent'
  const paths = getBreadcrumbPaths('c', pages)
  assert.equal(paths[0].partial, true)
  assert.equal(paths[0].items[0].missing, true)
})

test('page opened from linked database view', () => {
  const pages = seedPages()
  const paths = getBreadcrumbPaths('row', pages, {
    contextId: 'dbctx',
    sourcePageId: 'a',
    databaseViewId: 'view-1',
  })
  assert.equal(paths.some((p) => p.type === 'database'), true)
  assert.equal(paths.length >= 2, true)
})

test('page opened from relation property', () => {
  const pages = seedPages()
  const paths = getBreadcrumbPaths('row', pages, {
    contextId: 'relctx',
    relationPath: ['root', 'relHost'],
  })
  const rel = paths.find((p) => p.type === 'relation')
  assert.ok(rel)
  assert.deepEqual(rel!.items.map((i) => i.id), ['root', 'relHost', 'row'])
})

test('multiple paths available and selectable without moving page', () => {
  const pages = seedPages()
  const before = pages.row.parentId
  const paths = getBreadcrumbPaths('row', pages, {
    contextId: 'aliasctx',
    sourcePageId: 'aliasHost',
    aliasReferenceBlockId: 'alias-1',
  })
  assert.equal(paths.length >= 2, true)
  const canonical = paths.find((p) => p.type === 'canonical')
  const alternate = paths.find((p) => p.type !== 'canonical')
  assert.ok(canonical && alternate)
  assert.notDeepEqual(canonical!.items.map((i) => i.id), alternate!.items.map((i) => i.id))
  assert.equal(pages.row.parentId, before)
})

test('moving page updates canonical path but not contextual references', () => {
  const pages = seedPages()
  const initial = getBreadcrumbPaths('row', pages, {
    contextId: 'ctx',
    sourcePageId: 'aliasHost',
    aliasReferenceBlockId: 'a1',
  })
  movePage('row', 'a', pages)
  const after = getBreadcrumbPaths('row', pages, {
    contextId: 'ctx',
    sourcePageId: 'aliasHost',
    aliasReferenceBlockId: 'a1',
  })
  const initialCanonical = initial.find((p) => p.type === 'canonical')!
  const afterCanonical = after.find((p) => p.type === 'canonical')!
  assert.notDeepEqual(initialCanonical.items.map((i) => i.id), afterCanonical.items.map((i) => i.id))
  const initialAlt = initial.find((p) => p.type !== 'canonical')!
  const afterAlt = after.find((p) => p.type !== 'canonical')!
  assert.deepEqual(initialAlt.items.map((i) => i.id), afterAlt.items.map((i) => i.id))
})

test('missing context falls back to canonical', () => {
  const pages = seedPages()
  const paths = getBreadcrumbPaths('c', pages, { contextId: 'missing' })
  assert.equal(paths.length, 1)
  assert.equal(paths[0].type, 'canonical')
})

