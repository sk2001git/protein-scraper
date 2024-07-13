"use client"

import * as React from "react";

interface DateRangeOptionPickerProps{
  onChange: (option: string) => void;
  selectedOption: string;
}

export function DateRangeOptionPicker({
  onChange,
  selectedOption,
}: DateRangeOptionPickerProps) {
  const options = ["Day", "Week", "Month", "Year"];
  return 
}