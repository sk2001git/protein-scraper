import { createClient } from '@supabase/supabase-js';
import { DateRange } from "react-day-picker";

export const runtime = 'edge';

export interface Product {
  id: number;
  name: string;
}

interface PriceOverTime {
  date: string;
  Price: number;
  discount: number;
}
/**
 * Fetches all products from the product table
 * @returns  {Promise<Product[]>} - A list of products
 * @throws {Error} - Throws an error if the fetch fails
 */

export const fetchProductIds = async (): Promise<Product[]> => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.from('product').select('id, name');
  if (error) {
    console.error('Error fetching product IDs:', error);
    throw error;
  }
  return data;
};

/**
 * Fetches price data for a given product and date range from the price table
 * @param productId  - The ID of the product to fetch data for
 * @param dateRange  - The date range to fetch data for
 * @returns {Promise<PriceOverTime[]>} - A list of price data over time
 */

export const fetchPriceData = async (productId: Number, dateRange: DateRange | undefined): Promise<PriceOverTime[]> => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  let query = supabase.from('price').select('price, timestamp, discount_percentage').eq('productid', productId);

  if (dateRange?.from && dateRange?.to) {
    query = query.gte('timestamp', dateRange.from.toISOString()).lte('timestamp', dateRange.to.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
  return data.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('en-US'),
    Price: item.price,
    discount: item.discount_percentage,
  }));
};

export const getCurrentDiscount = async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  try {
    const { data: activeEvent, error: activeEventError } = await supabase
      .from('active_event')
      .select('discount_id')
      .single();

    if (activeEventError) {
      throw activeEventError;
    }

    const { data: discount, error: discountError } = await supabase
      .from('discounts')
      .select('discount_percentage')
      .eq('id', activeEvent.discount_id)
      .single();

    if (discountError) {
      throw discountError;
    } 

    return discount.discount_percentage;
  } catch (error) {
    console.error('Error fetching discount percentage:', error);
    return null;
  }
}

// Should return dictionary of weight and price
export const getCurrentProteinPrice = async () => {
  
}