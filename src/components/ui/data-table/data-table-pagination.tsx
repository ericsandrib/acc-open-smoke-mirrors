import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showItemCount?: boolean;
  showPagination?: boolean;
  sticky?: boolean;
  size?: "default" | "compact";
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  }

  return pages;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemCount = true,
  showPagination = true,
  sticky = false,
  size = "default",
}: DataTablePaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  const isCompact = size === "compact";
  const pageButtonSize = isCompact ? "size-7" : "size-9";

  return (
    <div
      className={cn(
        "flex items-center justify-between pl-4 pr-2 bg-muted/50 border-t border-border",
        isCompact ? "h-10" : "h-14",
        sticky && "sticky bottom-0"
      )}
    >
      {/* LHS -- Item count */}
      {showItemCount ? (
        <div className="flex items-center gap-1 text-sm font-medium">
          <span className="text-foreground">
            {startItem} to {endItem}
          </span>
          <span className="text-muted-foreground">
            of {totalItems.toLocaleString()} items
          </span>
        </div>
      ) : (
        <div />
      )}

      {/* RHS -- Pagination controls */}
      {showPagination ? (
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center gap-1 h-9 px-2.5 rounded-md text-sm font-medium text-muted-foreground",
              "hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            )}
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          {/* Page numbers */}
          {pages.map((page, i) =>
            page === "ellipsis" ? (
              <span
                key={`dots-${i}`}
                className={cn(
                  "flex items-center justify-center text-muted-foreground tracking-wider",
                  pageButtonSize
                )}
              >
                &bull;&bull;&bull;
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={cn(
                  "flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                  pageButtonSize,
                  currentPage === page
                    ? "bg-muted border border-border text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {page}
              </button>
            )
          )}

          {/* Next button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={cn(
              "flex items-center gap-1 h-9 px-2.5 rounded-md text-sm font-medium text-muted-foreground",
              "hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            )}
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
