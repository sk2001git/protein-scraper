"use client"
import { LineChart } from '@tremor/react';
import { Suspense, useEffect, useState } from 'react';
import { SearchBox } from '@/components/search-box';
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { DateRange } from "react-day-picker";
import { addDays } from 'date-fns';
import { fetchProductIds, fetchPriceData } from "@/backend/database"


export interface Product {
  id: number;
  name: string;

}
interface PriceOverTime {
  date: string;
  Price: number;
  discount: number;
}

// Testing
//const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const dataFormatter = (number: any) =>
  `$${Intl.NumberFormat('sg').format(number).toString()}`;

export function LineChartHero() {
  const today = new Date();
  const oneWeekAgo = addDays(today, -7);

  const [chartData, setChartData] = useState<PriceOverTime[]> ([]);
  const [productId, setProductId] = useState<Number>(1); // default to product ID 1
  const [products, setProducts] = useState<Product[]>([]);
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
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadPriceData = async () => {
      try {
        setLoading(true);
        const data = await fetchPriceData(productId, dateRange);
        const discountedData = data.map((item) => ({
          ...item,
          Price: item.Price * (1 - item.discount / 100),
        }));
        setChartData(discountedData);
      } catch (error) {
        console.error('Error loading price data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [productId, dateRange]);

  return (
    <div>
      <SearchBox
        products={products}
        productId={productId}
        setProductId={setProductId}
      />
      <CalendarDateRangePicker className="my-4" onChange={setDateRange} />
      <Suspense fallback={<div className="h-80 w-full">Loading.... </div>}>
        {loading ? (
          <Skeleton className="h-80 w-full bg-white" />
        ) : (
          <LineChart
            className="h-80"
            data={chartData}
            index="date"
            categories={['Price']}
            colors={['indigo']}
            valueFormatter={dataFormatter}
            yAxisWidth={60}
          />
        )}
      </Suspense>
    </div>
  );
}
