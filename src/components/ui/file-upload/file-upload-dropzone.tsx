import React, { useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  acceptedFileTypes?: string[]
  disabled?: boolean
}

export function FileUploadDropzone({
  onFilesSelected,
  acceptedFileTypes,
  disabled = false,
}: FileUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes?.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      <p className="text-sm text-muted-foreground">Drop to upload or</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleBrowseClick}
        disabled={disabled}
        className="h-9 gap-2 rounded px-3 py-1"
      >
        <Upload className="h-4 w-4" />
        <span className="text-sm font-medium">Browse Files</span>
      </Button>
    </div>
  )
}
