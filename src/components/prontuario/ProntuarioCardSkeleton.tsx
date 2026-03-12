import { Card, CardContent } from "@/components/ui/card";

export function ProntuarioCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border shadow-sm h-full flex flex-col">
      <CardContent className="p-6 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-40 bg-muted/60 animate-pulse rounded" />
              <div className="h-4 w-56 bg-muted/60 animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted/60 animate-pulse rounded" />
            </div>

            <div className="pt-2 space-y-2">
              <div className="h-4 w-full bg-muted/40 animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted/40 animate-pulse rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
