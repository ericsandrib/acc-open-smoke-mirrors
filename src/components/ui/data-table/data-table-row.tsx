import { cn } from "@/lib/utils";

interface DataTableRowProps {
  children: React.ReactNode;
  border?: boolean;
  selected?: boolean;
  zebra?: boolean;
  size?: "default" | "comfortable";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLTableRowElement>;
}

export function DataTableRow({
  children,
  border = true,
  selected = false,
  zebra = false,
  size = "default",
  className,
  onClick,
}: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors",
        border && "border-b border-border",
        selected ? "bg-muted" : "hover:bg-muted/50",
        zebra && !selected && "bg-muted/30",
        className
      )}
      data-state={selected ? "selected" : undefined}
      data-zebra={zebra || undefined}
      data-size={size}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
