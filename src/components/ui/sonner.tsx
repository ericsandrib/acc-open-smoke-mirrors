import { useTheme } from "@/stores/themeStore"
import { cn } from "@/lib/utils"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  const { colorScheme } = useTheme()

  return (
    <Sonner
      {...props}
      theme={colorScheme}
      className={cn("toaster group", className)}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...(toastOptions?.classNames ?? {}),
          toast: cn(
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            toastOptions?.classNames?.toast,
          ),
          description: cn(
            "group-[.toast]:text-muted-foreground",
            toastOptions?.classNames?.description,
          ),
          actionButton: cn(
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            toastOptions?.classNames?.actionButton,
          ),
          cancelButton: cn(
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            toastOptions?.classNames?.cancelButton,
          ),
        },
      }}
      offset={{ top: "0.75rem" }}
      position="top-center"
    />
  )
}

export { Toaster }
