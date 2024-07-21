import { createBrowserClient } from '@supabase/ssr';
import { DateRange } from "react-day-picker";
import { z } from 'zod';


export const runtime = 'edge';

// export interface Product {
//   id: number;
//   name: string;
// }

// interface PriceOverTime {
//   date: string;
//   Price: number;
//   discount: number;
// }
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// const PriceOverTimeSchema = z.object({
//   date: z.string(),
//   Price: z.number(),
//   discount: z.number().nullable(),
// });
// type PriceOverTime = z.infer<typeof PriceOverTimeSchema>;


export const optionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  option_type: z.string(),
  data_option_id: z.number(),
});

const PriceWithDiscountSchema = z.object({
  id: z.number(),
  price: z.number(),
  timestamp: z.string(),
  discounts: z.object({
    discount_percentage: z.number(),
  }).nullable(),
});

const OptionIdSchema = z.object({
  id: z.number(),
});


type Product = z.infer<typeof ProductSchema>;
export type Option = z.infer<typeof optionSchema>;
const OptionIdsSchema = z.array(OptionIdSchema);

/**
 * Fetches all products from the product table
 * @returns  {Promise<Product[]>} - A list of products
 * @throws {Error} - Throws an error if the fetch fails
 */

export const fetchProductIds = async (): Promise<Product[]> => {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.from('product').select('id, name');
  if (error) {
    console.error('Error fetching product IDs:', error);
    throw error;
  }
  return ProductSchema.array().parse(data);
};

export const fetchOptions = async (productId: number): Promise<Option[]> => {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.from('product_options').select('id, product_id, option_type, data_option_id').eq('product_id', productId);
  if (error) {
    console.error('Error fetching product IDs:', error);
    throw error;
  }
   const parsedData = optionSchema.array().parse(data);
  return parsedData;
}

/**
 * Fetches price data for a given product and date range from the price table
 * @param productId  - The ID of the product to fetch data for
 * @param dateRange  - The date range to fetch data for
 * @returns {Promise<PriceOverTime[]>} - A list of price data over time
 */

// export const fetchPriceData = async (productId: Number, dateRange: DateRange | undefined): Promise<PriceOverTime[]> => {
//   const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
//   let query = supabase.from('price').select('price, timestamp, discount_id').eq('productid', productId);

//   if (dateRange?.from && dateRange?.to) {
//     query = query.gte('timestamp', dateRange.from.toISOString()).lte('timestamp', dateRange.to.toISOString());
//   }

//   const { data, error } = await query;
//   if (error) {
//     console.error('Error fetching data:', error);
//     throw error;
//   }

//   const resolvedPromises = await Promise.all(
    
//     data.map(async (item) => {
//       const {data, error} = await supabase.from('discounts').select('discount_percentage').eq('id', item.discount_id).single();

//       const product = {
//         date: new Date(item.timestamp).toLocaleDateString('en-US'),
//         Price: item.price,
//         discount: data?.discount_percentage
//       };
//       return product;
//   }));
  
//   return resolvedPromises;
// };

export async function getPricesWithDiscounts(option_id: number, dateRange: DateRange | undefined) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  let query = supabase
    .from('price')
    .select(`
      id,
      price,
      timestamp,
      discount_id,
      discounts (
        discount_percentage
      )
    `)
    .eq('option_id', option_id);
  
    if (dateRange?.from && dateRange?.to) {
      query = query.gte('timestamp', dateRange.from.toISOString()).lte('timestamp', dateRange.to.toISOString());
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
    if (!data) {
      return [];
    }
  
    // Validate and process the data
    const validatedData = z.array(PriceWithDiscountSchema).parse(data);
  
    const processedData = validatedData.map(item => {
      const originalPrice = item.price;
      const discountPercentage = item.discounts?.discount_percentage ?? 0;
      const discountAmount = originalPrice * (discountPercentage / 100);
      const finalPrice = originalPrice - discountAmount;
  
      return {
        id: item.id,
        originalPrice,
        discountPercentage,
        discountAmount,
        finalPrice,
        timestamp: item.timestamp
      };
    });
  
    return processedData;
   

  
}

// export const getCurrentDiscount = async () => {
//   const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
//   try {
//     const { data: activeEvent, error: activeEventError } = await supabase
//       .from('active_event')
//       .select('discount_id')
//       .single();

//     if (activeEventError) {
//       throw activeEventError;
//     }

//     const { data: discount, error: discountError } = await supabase
//       .from('discounts')
//       .select('discount_percentage')
//       .eq('id', activeEvent.discount_id)
//       .single();

//     if (discountError) {
//       throw discountError;
//     } 

//     return discount.discount_percentage;
//   } catch (error) {
//     console.error('Error fetching discount percentage:', error);
//     return null;
//   }
// }

export const getCurrentDiscount = async (): Promise<number | null> => {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  try {

    const { data: responseData, error: responseError } = await supabase
    .from('active_event')
    .select('id, discount_id')
    .single();

    
    if (responseError) {
      throw responseError;
    }

    const { data, error } = await supabase
      .from('discounts')
      .select('discount_percentage')
      .eq('id', responseData?.discount_id)
      .single();
    

    if (error) {
      throw error;
    }
    return z.number().parse(data.discount_percentage);
  } catch (error) {
    console.error('Error fetching discount percentage:', error);
    return null;
  }
}

// Should return dictionary of weight and price
export const getCurrentProteinPrice = async () => {
  
}