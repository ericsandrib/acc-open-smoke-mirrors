import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FileUploadDropzone } from "./file-upload-dropzone"
import { FileItem, type FileItemStatus } from "./file-item"
import { FileLightbox } from "./file-lightbox"
import { cn } from "@/lib/utils"

export interface FileWithStatus {
  file: File
  status: FileItemStatus
  progress: number
}

export interface RestoredFile {
  name: string
  size?: number
}

interface FileUploadProps {
  id: string
  label?: string
  subtitle?: string
  hint?: string
  onFilesChange?: (files: FileWithStatus[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
  error?: string
  disabled?: boolean
  initialFiles?: RestoredFile[]
}

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 550,
  damping: 45,
  mass: 0.7,
}

export function FileUpload({
  id,
  label = "Label",
  subtitle = "Title",
  hint,
  onFilesChange,
  maxFiles,
  acceptedFileTypes,
  error,
  disabled = false,
  initialFiles,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [restoredFiles, setRestoredFiles] = useState<RestoredFile[]>(
    () => initialFiles ?? []
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  // Sync initialFiles when they change externally
  useEffect(() => {
    if (initialFiles && files.length === 0) {
      setRestoredFiles(initialFiles)
    }
  }, [initialFiles, files.length])

  const totalFileCount = files.length + restoredFiles.length

  const handleFilesSelected = (newFiles: File[]) => {
    if (disabled) return
    if (maxFiles && totalFileCount >= maxFiles) return

    const filesToAdd = maxFiles
      ? newFiles.slice(0, maxFiles - totalFileCount)
      : newFiles

    const newFilesWithStatus: FileWithStatus[] = filesToAdd.map((file) => ({
      file,
      status: "uploading" as const,
      progress: 0,
    }))

    const updatedFiles = [...files, ...newFilesWithStatus]
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)

    if (newFilesWithStatus.length > 0) {
      setIsExpanded(true)
    }

    newFilesWithStatus.forEach((_, index) => {
      const fileIndex = files.length + index
      simulateUpload(fileIndex)
    })
  }

  const simulateUpload = (fileIndex: number) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setFiles((prev) => {
        const updated = [...prev]
        if (updated[fileIndex]) {
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress: Math.min(progress, 100),
            status: progress >= 100 ? "complete" : "uploading",
          }
        }
        return updated
      })

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 100)
  }

  const handleDeleteFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const handleDeleteRestoredFile = (index: number) => {
    const updated = restoredFiles.filter((_, i) => i !== index)
    setRestoredFiles(updated)
    // Notify parent that files changed (pass current live files so parent can reconcile)
    onFilesChange?.(files)
  }

  const toggleExpand = () => {
    if (disabled) return
    if (totalFileCount > 0) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleFileClick = (file: File) => {
    setSelectedFile(file)
    setIsLightboxOpen(true)
  }

  const handleLightboxClose = () => {
    setIsLightboxOpen(false)
    setSelectedFile(null)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles)
    }
  }

  const isEmpty = totalFileCount === 0
  const isFilled = totalFileCount > 0
  const isMaxFilesReached = maxFiles !== undefined && totalFileCount >= maxFiles

  return (
    <div className="flex flex-col items-start w-full">
      <motion.div
        className={cn(
          "flex flex-col items-start relative rounded-xl w-full overflow-hidden",
          isEmpty
            ? "border border-dashed border-border bg-background"
            : "bg-muted/50",
          isDragging && !disabled && "bg-fill-success-tertiary border-border-success-primary border-2 border-dashed",
          error && "border border-destructive",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        initial={false}
        animate={{ borderRadius: 12 }}
        transition={SPRING_CONFIG}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-fill-success-tertiary/95 rounded-xl"
            >
              <p className="text-lg font-medium text-text-success-primary">Drop to upload</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between p-6 w-full">
          <div className="flex-1 flex flex-col items-start min-w-0">
            <p className="text-sm font-medium text-foreground leading-6 w-full">
              {label}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-4 w-full">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex gap-2 items-center shrink-0">
            {!isEmpty && (
              <motion.div
                layoutId={`file-count-badge-${id}`}
                transition={SPRING_CONFIG}
                layout
              >
                <Badge variant="success" className="rounded-full">
                  {totalFileCount} {totalFileCount === 1 ? "File" : "Files"}
                </Badge>
              </motion.div>
            )}

            {isEmpty && (
              <motion.div
                layoutId={`browse-files-dropzone-${id}`}
                transition={SPRING_CONFIG}
                initial={false}
              >
                <FileUploadDropzone
                  onFilesSelected={handleFilesSelected}
                  acceptedFileTypes={acceptedFileTypes}
                  disabled={disabled || isMaxFilesReached}
                />
              </motion.div>
            )}

            {!isEmpty && (
              <button
                onClick={toggleExpand}
                disabled={disabled}
                className="p-1 rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={SPRING_CONFIG}
                >
                  <ChevronDown className="h-5 w-5 text-foreground" />
                </motion.div>
              </button>
            )}
          </div>
        </div>

        {/* File List */}
        <AnimatePresence>
          {isFilled && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SPRING_CONFIG}
              className="w-full overflow-hidden"
            >
              <div className="h-px bg-border w-full" />

              <div className="flex flex-col items-start px-3 py-0 w-full">
                {/* Restored files (from store, no File blob) */}
                <AnimatePresence mode="popLayout">
                  {restoredFiles.map((rf, index) => (
                    <motion.div
                      key={`restored-${rf.name}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING_CONFIG}
                      className="w-full"
                    >
                      <FileItem
                        name={rf.name}
                        status="restored"
                        onDelete={disabled ? undefined : () => handleDeleteRestoredFile(index)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Live files (with File blob) */}
                <AnimatePresence mode="popLayout">
                  {files.map((fileWithStatus, index) => (
                    <motion.div
                      key={`${fileWithStatus.file.name}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING_CONFIG}
                      className="w-full"
                    >
                      <FileItem
                        file={fileWithStatus.file}
                        name={fileWithStatus.file.name}
                        status={fileWithStatus.status}
                        progress={fileWithStatus.progress}
                        onDelete={disabled ? undefined : () => handleDeleteFile(index)}
                        onClick={disabled ? undefined : () => handleFileClick(fileWithStatus.file)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="h-px bg-border w-full" />

              <div className="flex items-end justify-end p-6 w-full">
                {isMaxFilesReached ? (
                  <p className="text-sm text-muted-foreground">Maximum files reached ({maxFiles})</p>
                ) : (
                  <motion.div
                    layoutId={`browse-files-dropzone-${id}`}
                    transition={SPRING_CONFIG}
                    initial={false}
                  >
                    <FileUploadDropzone
                      onFilesSelected={handleFilesSelected}
                      acceptedFileTypes={acceptedFileTypes}
                      disabled={disabled || isMaxFilesReached}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hint / Error */}
      {(hint || error) && (
        <div className="flex items-center py-2 w-full">
          {error ? (
            <p className="text-xs text-destructive leading-4">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground leading-4">{hint}</p>
          )}
        </div>
      )}

      {/* Lightbox */}
      <FileLightbox
        file={selectedFile}
        isOpen={isLightboxOpen}
        onClose={handleLightboxClose}
      />
    </div>
  )
}
