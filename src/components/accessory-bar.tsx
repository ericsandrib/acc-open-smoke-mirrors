import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbSegment {
  label: string;
  href: string;
}

interface AccessoryBarProps {
  breadcrumbs: BreadcrumbSegment[];
  currentPage: string;
  showBackButton?: boolean;
  showBreadcrumb?: boolean;
  showBorder?: boolean;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export function AccessoryBar({
  breadcrumbs,
  currentPage,
  showBackButton = true,
  showBreadcrumb = true,
  showBorder = true,
  centerContent,
  rightContent,
  className,
}: AccessoryBarProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between h-14 py-1 bg-background relative",
        className
      )}
    >
      {/* Left: back button + breadcrumb */}
      <div className="flex items-center gap-2 px-2 min-w-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {showBreadcrumb && (
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              {breadcrumbs.map((segment) => (
                <React.Fragment key={segment.href}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={segment.href}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {segment.label}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </React.Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-normal truncate">
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* Center */}
      {centerContent && (
        <div className="flex items-center justify-center">
          {centerContent}
        </div>
      )}

      {/* Right */}
      {rightContent && (
        <div className="flex items-center px-2">
          {rightContent}
        </div>
      )}

      {/* Bottom border */}
      {showBorder && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      )}
    </div>
  );
}
