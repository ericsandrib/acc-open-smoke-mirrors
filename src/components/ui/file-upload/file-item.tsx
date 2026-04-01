import React, { useState, useEffect } from "react"
import { Paperclip, Check, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type FileItemStatus = "uploading" | "complete" | "error" | "restored"

interface FileItemProps {
  file?: File
  name: string
  status?: FileItemStatus
  progress?: number
  onDelete?: () => void
  onClick?: () => void
}

export function FileItem({
  file,
  name,
  status = "complete",
  progress = 100,
  onDelete,
  onClick,
}: FileItemProps) {
  const isComplete = status === "complete"
  const isUploading = status === "uploading"
  const isError = status === "error"
  const isRestored = status === "restored"
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const isImage = file?.type.startsWith("image/")

  useEffect(() => {
    if (file && isImage) {
      const url = URL.createObjectURL(file)
      setThumbnailUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file, isImage])

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[aria-label="Delete file"]')) {
      return
    }
    onClick?.()
  }

  return (
    <div
      className={cn(
        "flex gap-2 items-center p-3 w-full",
        onClick && "cursor-pointer hover:bg-muted/30 rounded transition-colors"
      )}
      onClick={handleClick}
    >
      {/* Icon/Thumbnail */}
      <div className="bg-muted flex items-center justify-center p-2.5 rounded size-12 shrink-0 overflow-hidden">
        {isImage && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Paperclip className="h-4 w-4 text-foreground" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex gap-1 items-center w-full">
          <div className="flex-1 flex flex-col min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {name}
            </p>
            <div className="flex gap-1 items-center">
              {(isComplete || isRestored) && (
                <>
                  <Check className="h-3 w-3 text-text-success-primary" />
                  <p className="text-xs text-text-success-primary">Upload Complete</p>
                </>
              )}
              {isUploading && (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              )}
              {isError && (
                <>
                  <X className="h-3 w-3 text-destructive" />
                  <p className="text-xs text-destructive">Upload Failed</p>
                </>
              )}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-muted transition-colors shrink-0"
              aria-label="Delete file"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {!isRestored && (
          <div className="w-full">
            <div className="bg-muted h-1 rounded overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isError
                    ? "bg-destructive"
                    : isComplete
                      ? "bg-fill-success-primary"
                      : "bg-muted-foreground"
                )}
                style={{ width: `${isError ? 100 : progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
