import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileLightboxProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
}

export function FileLightbox({ file, isOpen, onClose }: FileLightboxProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const isImage = file && file.type.startsWith("image/")
  const isViewable =
    file &&
    (file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      file.type.startsWith("text/") ||
      file.type === "application/json")

  useEffect(() => {
    if (file && isOpen) {
      const url = URL.createObjectURL(file)
      setBlobUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setBlobUrl(null)
    }
  }, [file, isOpen])

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0">
          {isViewable && blobUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={blobUrl}
                  alt={file.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            ) : (
              <iframe
                src={blobUrl}
                className="w-full h-[60vh] border-0"
                title={file.name}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p>Preview not available for this file type</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
