import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableHeaderProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  interactive?: boolean;
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
  size?: "default" | "comfortable";
  className?: string;
  style?: React.CSSProperties;
}

const alignClasses = {
  start: "text-left",
  end: "text-right",
  center: "text-center",
} as const;

const justifyClasses = {
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
} as const;

export function DataTableHeader({
  children,
  align = "start",
  interactive = true,
  sortable = false,
  sorted = false,
  onSort,
  size = "default",
  className,
  style,
}: DataTableHeaderProps) {
  const SortIcon = sorted === "asc" ? ChevronUp : sorted === "desc" ? ChevronDown : ChevronsUpDown;

  const content = interactive && sortable ? (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "flex items-center gap-1 px-2 w-full h-full rounded cursor-pointer transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        justifyClasses[align]
      )}
    >
      <span
        className={cn(
          "text-xs font-medium leading-4 whitespace-nowrap",
          sorted ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
      </span>
      <SortIcon className="size-3 shrink-0 text-muted-foreground" />
    </button>
  ) : (
    <span
      className={cn(
        "px-2 text-xs font-medium leading-4 whitespace-nowrap text-muted-foreground",
        alignClasses[align]
      )}
    >
      {children}
    </span>
  );

  return (
    <th
      className={cn(
        "px-1",
        size === "default" ? "h-10 pt-2 pb-1" : "h-12 pt-2.5 pb-1.5",
        alignClasses[align],
        className
      )}
      style={style}
    >
      {content}
    </th>
  );
}
