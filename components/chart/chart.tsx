"use client"
import { createClient } from '@supabase/supabase-js';
import { LineChart } from '@tremor/react';
import { useEffect, useState } from 'react';
import { ComboboxDemo } from '@/components/search-box';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import { DateRange } from "react-day-picker";
import { addDays } from 'date-fns';


export interface Product {
  id: number;
  name: string;
}
interface PriceOverTime {
  date: string;
  Price: number;

}

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

  useEffect(() => {
    async function fetchProductIds() {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data, error } = await supabase
        .from('product')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching product IDs:', error);
      } else {
        setProducts(data);
        
      }
    }

    fetchProductIds();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      let query = supabase
        .from('price')
        .select('price, timestamp')
        .eq('productid', productId);
      
      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte('timestamp', dateRange.from.toISOString())
          .lte('timestamp', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        const formattedData = data.map((item) => ({
          date: new Date(item.timestamp).toLocaleDateString('en-US'),
          Price: item.price,
        }));
        setChartData(formattedData);
      }
    }

    fetchData();
  }, [productId, dateRange]);

  return (
    <div>
      <ComboboxDemo
        products={products}
        productId={productId}
        setProductId={setProductId}
      />
      <CalendarDateRangePicker className="my-4" onChange={setDateRange} />
      <LineChart
        className="h-80"
        data={chartData}
        index="date"
        categories={['Price']}
        colors={['indigo']}
        valueFormatter={dataFormatter}
        yAxisWidth={60}
      />
    </div>
  );
}
