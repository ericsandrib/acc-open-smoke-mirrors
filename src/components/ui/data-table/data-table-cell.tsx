import { cn } from "@/lib/utils";

interface DataTableCellProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  type?: "primary" | "secondary" | "positive" | "negative" | "link" | "badge" | "person" | "relationship" | "button" | "document" | "options";
  size?: "default" | "comfortable";
  className?: string;
  style?: React.CSSProperties;
}

const alignClasses = {
  start: "text-left",
  end: "text-right",
  center: "text-center",
} as const;

const typeColorClasses: Record<string, string> = {
  primary: "text-foreground",
  secondary: "text-muted-foreground",
  positive: "text-green-600 dark:text-green-400",
  negative: "text-destructive",
  link: "text-foreground",
  badge: "",
  person: "text-foreground",
  relationship: "text-foreground",
  button: "",
  document: "text-foreground",
  options: "",
};

export function DataTableCell({
  children,
  align = "start",
  type = "primary",
  size = "default",
  className,
  style,
}: DataTableCellProps) {
  return (
    <td
      className={cn(
        "px-1 text-sm leading-5 whitespace-nowrap",
        size === "default" ? "h-12 pt-2 pb-2" : "h-14 pt-2.5 pb-2.5",
        alignClasses[align],
        typeColorClasses[type],
        className
      )}
      style={style}
    >
      <div className={cn("px-2", align === "end" && "flex justify-end", align === "center" && "flex justify-center")}>
        {children}
      </div>
    </td>
  );
}
