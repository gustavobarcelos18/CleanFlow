import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DigitalClockProps {
  className?: string;
}

export function DigitalClock({ className }: DigitalClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = format(currentTime, "HH");
  const minutes = format(currentTime, "mm");
  const seconds = format(currentTime, "ss");

  return (
    <Card className={cn("overflow-hidden border-2 border-primary/20 bg-card/80 backdrop-blur shadow-lg", className)}>
      <CardContent className="p-6">
        {/* Relógio Digital */}
        <div className="flex items-center justify-center">
          <div className="flex items-baseline gap-1 md:gap-2">
            <span className="text-6xl md:text-7xl font-bold text-foreground tabular-nums tracking-tighter">
              {hours}
            </span>
            <span className="text-6xl md:text-7xl font-bold text-primary animate-pulse">
              :
            </span>
            <span className="text-6xl md:text-7xl font-bold text-foreground tabular-nums tracking-tighter">
              {minutes}
            </span>
            <span className="text-6xl md:text-7xl font-bold text-muted-foreground/50 animate-pulse">
              :
            </span>
            <span className="text-4xl md:text-5xl font-bold text-muted-foreground tabular-nums tracking-tighter">
              {seconds}
            </span>
          </div>
        </div>

        {/* Linha decorativa */}
        <div className="mt-3 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full" />
      </CardContent>
    </Card>
  );
}
