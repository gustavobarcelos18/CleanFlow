import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function PatientCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border shadow-sm bg-card animate-pulse h-full flex flex-col">
      <CardContent className="p-6 flex-grow flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
        </div>

        <div className="mt-6 pt-6 border-t border-border space-y-3 flex-grow">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>

        <div className="mt-6 flex gap-2">
          <div className="h-9 flex-1 bg-muted rounded" />
          <div className="h-9 w-24 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded" />
        </div>
      </CardContent>
      <div className="px-6 py-3 bg-muted/30 border-t border-border h-[45px]" />
    </Card>
  );
}
