import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

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

export function SupportingDocumentPreviewProvider({ children }: { children: ReactNode }) {
  const urlsRef = useRef(new Map<string, string>())

  const revokePreview = useCallback((key: string) => {
    const prev = urlsRef.current.get(key)
    if (prev) {
      URL.revokeObjectURL(prev)
      urlsRef.current.delete(key)
    }
  }, [])

  const registerPreview = useCallback(
    (key: string, file: File) => {
      revokePreview(key)
      urlsRef.current.set(key, URL.createObjectURL(file))
    },
    [revokePreview],
  )

  const getPreviewUrl = useCallback((key: string) => urlsRef.current.get(key), [])

  useEffect(() => {
    const map = urlsRef.current
    return () => {
      for (const u of map.values()) URL.revokeObjectURL(u)
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
