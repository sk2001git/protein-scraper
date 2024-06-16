"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from "react-day-picker";


import { Product } from "@/components/chart/chart"
interface ComboboxDemoProps {
  products: Product[];
  productId: Number | 0;
  setProductId: (productId: Number) => void;
}

export function ComboboxDemo({ products, productId, setProductId }: ComboboxDemoProps) {
  const [open, setOpen] = React.useState(false)

  const selectedProduct = products.find(product => product.id === productId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between truncate flex"  // Box reference before you click
        >
          {selectedProduct
            ? selectedProduct.name
            : "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup> 
              {products.map((product) => ( // Individual boxes for each product
                <CommandItem
                  key={product.id}
                  value={product.id.toString()}
                  onSelect={(currentValue) => {
                    const newProductId = Number(currentValue);
                    setProductId(newProductId === productId ? 0 : newProductId)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      productId === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">
                    {product.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
