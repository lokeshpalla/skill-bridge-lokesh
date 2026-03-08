import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-3 h-56 rounded-xl" />
        <Skeleton className="lg:col-span-2 h-56 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return <Skeleton className="h-48 rounded-xl" />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-muted-foreground/50" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
