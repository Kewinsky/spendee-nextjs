"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MonthYearFilterProps {
  value?: string; // YYYY-MM format
  onChange: (value: string) => void; // YYYY-MM format
  className?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function MonthPicker({
  value,
  onChange,
  className,
  placeholder = "Select month",
  disabled = false,
}: Omit<MonthYearFilterProps, "label">) {
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    if (value) {
      return value.split("-")[1] || currentMonth;
    }
    return currentMonth;
  });

  const [selectedYear, setSelectedYear] = React.useState<string>(() => {
    if (value) {
      return value.split("-")[0] || currentYear;
    }
    return currentYear;
  });

  const yearOptions = React.useMemo(() => {
    const years = [];
    const startYear = Number.parseInt(currentYear) - 2;
    const endYear = Number.parseInt(currentYear);

    for (let year = startYear; year <= endYear; year++) {
      years.push({
        value: String(year),
        label: String(year),
      });
    }
    return years.reverse();
  }, [currentYear]);

  React.useEffect(() => {
    if (selectedMonth && selectedYear) {
      const newValue = `${selectedYear}-${selectedMonth}`;
      onChange(newValue);
    }
  }, [selectedMonth, selectedYear, onChange]);

  React.useEffect(() => {
    if (!value) {
      onChange(`${currentYear}-${currentMonth}`);
    }
  }, [value, onChange, currentYear, currentMonth]);

  React.useEffect(() => {
    if (value && value !== `${selectedYear}-${selectedMonth}`) {
      const [year, month] = value.split("-");
      if (year && month) {
        setSelectedYear(year);
        setSelectedMonth(month);
      }
    }
  }, [value, selectedYear, selectedMonth]);

  const selectedMonthLabel = MONTHS.find(
    (m) => m.value === selectedMonth
  )?.label;
  const displayValue =
    selectedMonthLabel && selectedYear
      ? `${selectedMonthLabel} ${selectedYear}`
      : placeholder;

  return (
    <Select
      value={value || `${selectedYear}-${selectedMonth}`}
      onValueChange={(newValue) => {
        const [year, month] = newValue.split("-");
        setSelectedYear(year);
        setSelectedMonth(month);
        onChange(newValue);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[200px]", className)}>
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {yearOptions.map((year) => (
          <div key={year.value}>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              {year.label}
            </div>
            {MONTHS.map((month) => (
              <SelectItem
                key={`${year.value}-${month.value}`}
                value={`${year.value}-${month.value}`}
                className="pl-6"
              >
                {month.label}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
