import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { collectJourneySupportingDocumentRows } from '@/utils/journeySupportingDocuments'
import { resolveSupportingDocumentDemoHref } from '@/utils/supportingDocumentPreviewResolve'

export type SupportingDocumentPreviewApi = {
  registerPreview: (key: string, file: File) => void
  revokePreview: (key: string) => void
  getPreviewUrl: (key: string) => string | undefined
}

const noop: SupportingDocumentPreviewApi = {
  registerPreview: () => {},
  revokePreview: () => {},
  getPreviewUrl: () => undefined,
}

const SupportingDocumentPreviewContext = createContext<SupportingDocumentPreviewApi>(noop)

function isBlobPreviewUrl(url: string): boolean {
  return url.startsWith('blob:')
}

export function SupportingDocumentPreviewProvider({ children }: { children: ReactNode }) {
  const { state } = useWorkflow()
  const urlsRef = useRef(new Map<string, string>())

  const revokePreview = useCallback((key: string) => {
    const prev = urlsRef.current.get(key)
    if (prev && isBlobPreviewUrl(prev)) {
      URL.revokeObjectURL(prev)
    }
    urlsRef.current.delete(key)
  }, [])

  const registerPreview = useCallback(
    (key: string, file: File) => {
      revokePreview(key)
      urlsRef.current.set(key, URL.createObjectURL(file))
    },
    [revokePreview],
  )

  const getPreviewUrl = useCallback((key: string) => urlsRef.current.get(key), [])

  /** Demo PDF placeholders for persisted filenames when session blob URLs are gone (review / reload). */
  useEffect(() => {
    const map = urlsRef.current
    const rows = collectJourneySupportingDocumentRows(state)
    const activeKeys = new Set(rows.map((r) => r.previewKey))

    for (const row of rows) {
      const demoHref = resolveSupportingDocumentDemoHref(row.fileName)
      if (!demoHref) continue
      const existing = map.get(row.previewKey)
      if (existing && isBlobPreviewUrl(existing)) continue
      map.set(row.previewKey, demoHref)
    }

    for (const [key, url] of [...map.entries()]) {
      if (!activeKeys.has(key) && !isBlobPreviewUrl(url)) {
        map.delete(key)
      }
    }
  }, [state])

  useEffect(() => {
    const map = urlsRef.current
    return () => {
      for (const u of map.values()) {
        if (isBlobPreviewUrl(u)) URL.revokeObjectURL(u)
      }
      map.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ registerPreview, revokePreview, getPreviewUrl }),
    [registerPreview, revokePreview, getPreviewUrl],
  )

  return (
    <SupportingDocumentPreviewContext.Provider value={value}>
      {children}
    </SupportingDocumentPreviewContext.Provider>
  )
}

export function useSupportingDocumentPreview(): SupportingDocumentPreviewApi {
  return useContext(SupportingDocumentPreviewContext)
}
