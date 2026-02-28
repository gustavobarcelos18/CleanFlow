import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
  className,
}: StatsCardProps) {
  const variantStyles = {
    default: "border-border bg-card hover:bg-card-hover",
    success: "border-success/20 bg-success/10",
    warning: "border-warning/20 bg-warning/10",
    destructive: "border-destructive/20 bg-destructive/10",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const changeStyles = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "p-6 rounded-lg border transition-colors duration-200",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn("text-xs font-medium", changeStyles[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-full",
            variant === "default" ? "bg-primary/10" : "bg-background/50",
          )}
        >
          <Icon className={cn("h-6 w-6", iconStyles[variant])} />
        </div>
      </div>
    </div>
  );
}
