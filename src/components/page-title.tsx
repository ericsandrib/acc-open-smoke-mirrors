import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageTitleProps {
  title: string;
  subHead?: string;
  size?: "default" | "small";
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

export function PageTitle({
  title,
  subHead,
  size = "default",
  primaryAction,
  secondaryAction,
  className,
}: PageTitleProps) {
  const hasControls = primaryAction || secondaryAction;

  return (
    <div
      className={cn(
        "flex items-center",
        size === "small" ? "py-3" : "pt-2 pb-4",
        className
      )}
    >
      <div className="flex flex-col items-start justify-center flex-1">
        <h1
          className={cn(
            "font-semibold text-text-primary",
            size === "small"
              ? "text-2xl leading-8 tracking-[-0.6px]"
              : "text-3xl leading-10 tracking-[-0.75px]"
          )}
        >
          {title}
        </h1>
        {subHead && (
          <p className="text-base font-medium leading-6 text-text-secondary">
            {subHead}
          </p>
        )}
      </div>
      {hasControls && (
        <div className="flex items-center gap-2 shrink-0">
          {secondaryAction && (
            <Button
              variant="outline"
              size={size === "small" ? "sm" : "default"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              size={size === "small" ? "sm" : "default"}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
