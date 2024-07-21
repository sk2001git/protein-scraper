"use client"
import { Suspense, useEffect, useState } from 'react';
import { SearchBox } from '@/components/search-box';
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { DateRange } from "react-day-picker";
import { addDays} from 'date-fns';
import {fetchOptions, fetchProductIds, getPricesWithDiscounts, Option} from "@/backend/database"
import { OptionSelect } from '../options-dropdown';
import { PriceChart } from './cnchart';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';


export interface Product {
  id: number;
  name: string;

}


const chartSchema = z.object({
  date: z.string(),
  price: z.number(),
});

type ChartData = z.infer<typeof chartSchema>;




export function LineChartHero() {
  const today = new Date();
  const oneWeekAgo = addDays(today, -7);

  const [productId, setProductId] = useState<number>(1);
  const [optionId, setOptionId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: oneWeekAgo,
    to: today,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProductIds,
  });

  const { data: options = [] } = useQuery<Option[]>({
    queryKey: ['options', productId],
    queryFn: () => fetchOptions(productId),
    enabled: !!productId,
  });

  const { data: chartData = [], isLoading } = useQuery<ChartData[]>({
    queryKey: ['priceData', optionId, dateRange],
    queryFn: async () => {
      if (optionId === null) return [];
      const data = await getPricesWithDiscounts(optionId, dateRange);
      return data.map((item) => ({
        date: item.timestamp,
        price: parseFloat(item.finalPrice.toFixed(2)),
      }));
    },
    enabled: !!optionId && !!dateRange,
  });
  return (
    <div>
      <div className="flex space-x-4">
        <SearchBox
          products={products}
          productId={productId}
          setProductId={setProductId}
        />
        <OptionSelect 
          options={options}
          setOptionId={setOptionId}
        />
      </div>
     
      <CalendarDateRangePicker className="my-4" onChange={setDateRange} />
      <Suspense fallback={<div className="h-80 w-full">Loading.... </div>}>
        {isLoading  ? (
          <Skeleton className="h-80 w-full bg-white" />
        ) : chartData.length > 0 ? (
          <PriceChart data={chartData} />
        ) : (
          <div className="h-80 w-full flex items-center justify-center">
            No price data available for the selected option and date range.
          </div>
        )}
      </Suspense>
    </div>
  );
}
