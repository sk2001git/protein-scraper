"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Option } from "@/backend/database"; // Adjust the import path as needed

interface SelectProps {
  options: Option[];
  setOptionId: (id: number | null) => void;
}

export function OptionSelect({ options, setOptionId }: SelectProps) {
  const selectKey = React.useMemo(() => JSON.stringify(options), [options]);

  const handleValueChange = React.useCallback((value: string) => {
    setOptionId(value ? Number(value) : null);
  }, [setOptionId]);

  return (
    <Select key={selectKey} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[360px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options && options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.option_type}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-gray-500">No records found</div>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}