import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ── Variant types shared across list + trigger ──

type TabsVariant = "border" | "pill" | "elevated"

interface TabsStyleContext {
  variant: TabsVariant
}

const TabsStyleCtx = React.createContext<TabsStyleContext>({
  variant: "border",
})

// ── Root ──

const Tabs = TabsPrimitive.Root

// ── List ──

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-text-secondary",
  {
    variants: {
      variant: {
        border: "gap-0",
        pill: "gap-1",
        elevated: "rounded-lg bg-fill-neutral-secondary p-1",
      },
    },
    defaultVariants: {
      variant: "border",
    },
  }
)

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "border", ...props }, ref) => (
  <TabsStyleCtx.Provider value={{ variant: variant! }}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsStyleCtx.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

// ── Trigger ──

const tabsTriggerBase = [
  "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
  "cursor-pointer",
].join(" ")

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { variant } = React.useContext(TabsStyleCtx)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerBase,

        // ── Border variant: underline-style indicator ──
        variant === "border" && [
          "rounded-none border-b-2 border-transparent",
          "text-text-secondary",
          "hover:text-text-primary",
          "data-[state=active]:border-border-brand-primary data-[state=active]:text-text-primary",
        ],

        // ── Pill variant: rounded background indicator ──
        variant === "pill" && [
          "rounded-md",
          "text-text-secondary",
          "hover:text-text-primary hover:bg-fill-neutral-tertiary",
          "data-[state=active]:bg-fill-brand-tertiary data-[state=active]:text-text-brand-primary",
        ],

        // ── Elevated variant: shadow-based card-style tabs ──
        variant === "elevated" && [
          "rounded-md",
          "text-text-secondary",
          "data-[state=active]:bg-background data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
        ],

        className,
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// ── Content ──

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsVariant, TabsListProps }
