"use client"
import { Suspense, useEffect, useState } from 'react';
import { SearchBox } from '@/components/search-box';
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { DateRange } from "react-day-picker";
import { addDays} from 'date-fns';
import {fetchOptions, fetchProductIds, getPricesWithDiscounts, optionSchema, Option} from "@/backend/database"
import { OptionSelect } from '../options-dropdown';
import { PriceChart } from './cnchart';
import { z } from 'zod';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'



export interface Product {
  id: number;
  name: string;

}


const chartSchema = z.object({
  date: z.string(),
  price: z.number(),
});

type ChartData = z.infer<typeof chartSchema>;

const queryClient = new QueryClient()



export function LineChartHero() {
  const today = new Date();
  const oneWeekAgo = addDays(today, -7);

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [productId, setProductId] = useState<number>(1); 
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [optionId, setOptionId] = useState<number | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: oneWeekAgo,
    to: today,
  });
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProductIds();
        setProducts(data);
        console.log(data);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadOptions = async (productid: number) => {
      try {
        const data = await fetchOptions(productid);
        setOptions(data);
      } catch (error) {
        console.error('Error loading option:', error);
      }
    }
    loadOptions(productId);
  }, [productId]);

  
  useEffect(() => {
    const loadPriceData = async () => {
      if (optionId === null) {
        setChartData([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getPricesWithDiscounts(optionId, dateRange);
        console.log('Fetched price data:', data);
        const discountedData: ChartData[] = data.map((item) => ({
          date: item.timestamp,
          price: parseFloat(item.finalPrice.toFixed(2)),
        }));
        setChartData(discountedData);
      } catch (error) {
        console.error('Error loading price data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [optionId, dateRange]);

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
        {loading ? (
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
