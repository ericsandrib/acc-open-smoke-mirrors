import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white shadow",
        outline: "text-foreground",
        success: "bg-fill-success-tertiary text-text-success-primary border-border-success-primary",
        warning: "bg-fill-warning-tertiary text-text-warning-primary border-border-warning-primary",
        danger: "bg-fill-danger-tertiary text-text-danger-primary border-border-danger-primary",
        info: "bg-fill-category1-tertiary text-text-category1-primary border-border-category1-primary",
        neutral: "bg-fill-neutral-secondary text-text-secondary border-border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
