"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CalendarDateRangePickerProps {
  className?: string;
  onChange: (range: DateRange | undefined) => void;
}

export function CalendarDateRangePicker({
  className,
  onChange,
}: CalendarDateRangePickerProps) {
  const today = new Date();
  const oneWeekAgo = addDays(today, -7);

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: oneWeekAgo,
    to: today,
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    onChange(range);
  };

  const setWeek = () => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    handleDateRangeChange({ from: start, to: end });
  };

  const setMonth = () => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    handleDateRangeChange({ from: start, to: end });
  };

  const setYear = () => {
    const start = startOfYear(today);
    const end = endOfYear(today);
    handleDateRangeChange({ from: start, to: end });
  };

  React.useEffect(() => {
    onChange(date);
  }, [date, onChange]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Select Range</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={setWeek}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={setMonth}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={setYear}>This Year</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}