"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Product } from "@/components/chart/chart";

interface SearchBoxProps {
  products: Product[];
  productId: number | 0;
  setProductId: (productId: number) => void;
}

export function SearchBox({
  products,
  productId,
  setProductId,
}: SearchBoxProps) {
  const [open, setOpen] = React.useState<boolean>(false);

  const selectedProduct = products.find((product) => product.id === productId);
 




  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[360px] justify-between truncate flex" // Box reference before you click
        >
          {selectedProduct ? selectedProduct.name : "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0">
        <Command>
          <CommandInput
            placeholder="Search product..."
          />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup heading="Items">
              {products.map((product) => (
                <CommandItem
                  key={product.id} 
                  value={product.name} // This is used for search bar value
                  onSelect={(currentValue) => {
                    const selectedProduct = products.find((product) => product.name === currentValue);
                    if (selectedProduct) {
                      const newProductId = selectedProduct.id;
                      setProductId(newProductId === productId ? 0 : newProductId);
                      setOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      productId === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
