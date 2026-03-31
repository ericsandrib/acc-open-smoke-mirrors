import { Upload } from 'lucide-react'

function UploadArea({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center">
        <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">{description}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          PDF, JPG, or PNG up to 10 MB
        </p>
      </div>
    </div>
  )
}

export function KycChildDocumentsForm() {
  return (
    <div className="space-y-6">
      <UploadArea
        title="Government-Issued ID"
        description="Upload a passport, driver's license, or national ID card"
      />
      <UploadArea
        title="Supporting Documents"
        description="Upload proof of address, utility bills, or other supporting documentation"
      />
    </div>
  )
}
