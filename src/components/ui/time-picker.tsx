import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  minuteStep?: number;
  isHourDisabled?: (hour: string) => boolean;
  isMinuteDisabled?: (hour: string, minute: string) => boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "--:--",
  className,
  minuteStep = 5,
  isHourDisabled,
  isMinuteDisabled,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const hour = value?.split(":")[0];
  const minute = value?.split(":")[1];

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  // Generate minutes in steps for faster selection, medical softwares usually use 5, 10 or 15 mins blocks
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
    (i * minuteStep).toString().padStart(2, "0"),
  );

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    if (type === "hour") {
      onChange(`${val}:${minute || "00"}`);
    } else {
      onChange(`${hour || "00"}:${val}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-input bg-transparent",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
          {value || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover border shadow-md rounded-md overflow-hidden"
        align="start"
      >
        <div className="flex bg-popover divide-x divide-border h-[280px]">
          <div className="flex flex-col w-[84px] h-full pointer-events-auto">
            <div className="text-xs font-medium text-center py-2 text-muted-foreground bg-popover z-10 border-b shadow-sm w-full shrink-0">
              Hora
            </div>
            <div className="w-full h-[240px] overflow-y-auto sidebar-scroll">
              <div className="flex flex-col gap-1 p-1 pr-2 pb-6">
                {hours.map((h) => {
                  const disabled = isHourDisabled?.(h);
                  return (
                    <Button
                      key={h}
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      className={cn(
                        "w-full justify-center tracking-wider text-sm rounded-md",
                        hour === h
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => handleTimeChange("hour", h)}
                    >
                      {h}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-[84px] h-full pointer-events-auto">
            <div className="text-xs font-medium text-center py-2 text-muted-foreground bg-popover z-10 border-b shadow-sm w-full shrink-0">
              Min
            </div>
            <div className="w-full h-[240px] overflow-y-auto sidebar-scroll">
              <div className="flex flex-col gap-1 p-1 pr-2 pb-6">
                {minutes.map((m) => {
                  const disabled = isMinuteDisabled?.(hour || "00", m);
                  return (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      className={cn(
                        "w-full justify-center tracking-wider text-sm rounded-md",
                        minute === m
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => handleTimeChange("minute", m)}
                    >
                      {m}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
