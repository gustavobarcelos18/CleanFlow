import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(
    props.month || props.selected as Date || new Date()
  );

  React.useEffect(() => {
    if (props.selected && props.selected instanceof Date) {
      setMonth(props.selected);
    }
  }, [props.selected]);

  const CustomCaption = ({ displayMonth }: CaptionProps) => {
    const currentYear = displayMonth.getFullYear();
    const currentMonthIndex = displayMonth.getMonth();

    // Gera lista de anos (de 1900 até ano atual + 10)
    const years = Array.from({ length: new Date().getFullYear() - 1900 + 11 }, (_, i) => 1900 + i);
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handleMonthChange = (monthStr: string) => {
      const newDate = new Date(currentYear, parseInt(monthStr), 1);
      setMonth(newDate);
    };

    const handleYearChange = (yearStr: string) => {
      const newDate = new Date(parseInt(yearStr), currentMonthIndex, 1);
      setMonth(newDate);
    };

    return (
      <div className="flex justify-center gap-2 items-center py-2">
        <Select value={currentMonthIndex.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue>{months[currentMonthIndex]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((monthName, index) => (
              <SelectItem key={index} value={index.toString()}>
                {monthName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[90px] h-8">
            <SelectValue>{currentYear}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.reverse().map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto min-h-[320px]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
