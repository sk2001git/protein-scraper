
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { IncomingHttpHeaders } from 'http';
import { cheerioScrapeProductDetails, scrapeProductOffers, updateOptions, updateProduct } from '@/backend/api/product';
import { insertPrice } from '@/backend/api/price';
import { changeActiveEvent } from '@/backend/api/active-events';
import { triggerDiscounts } from '@/backend/api/discounts';
import { DiscountDetails } from '@/types/discount-details';
import { upsertURL } from '@/backend/api/url';

export const runtime = 'edge';

/**
 * Triggers when discount banner changes and updates all relevant tables including discount, discount_date_ranges and active_event
 * @param url  The URL of the product page
 * @param supabase The supabase client to be re-used
 * @returns data regarding discount details such as the event_name, and discount_percentage
 */
const triggerDiscountWorkflow = async (url:string, supabase: SupabaseClient): Promise<DiscountDetails | null> => { 
  // This triggers the check for discounts, creating them if not present, and then returning the discount object 
  try {
    const data = await triggerDiscounts(url, supabase);
    // We then update the active_event with the discount id as well as the discount_date_ranges table
    if (!data || !data.id){
      console.error('Failed to trigger discount workflow: No data returned');
      return null;
    }
    await changeActiveEvent(new Date(), data.id!, data.event_name!, supabase);
    return data;
  } catch (error) {
    console.error('Error triggering discount workflow:', error);
    return null;
  }
  
}


/**
 * Checks the headers of the request to ensure it is a GET request and has the correct secret and thus is valid.
 * @param req NextApiRequest passed from the handler
 * @returns NextResponse if headers are invalid, null if headers are valid
 */
const checkHeaders = (req: NextApiRequest): NextResponse | null => {
  if (req.method !== 'GET') {
    return NextResponse.json({error: 'Method Not Allowed'}, { status: 405 });
  }
  const url = req.url! as string // Might need to decode if u decide to fetch from client component
  
  
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }  
  const headers = req.headers as IncomingHttpHeaders;
  //@ts-ignore: Despite using the headers type as well as optional chaining, TypeScript still complains about the type of headers.get
  // const secret = headers?.get('cron-secret');

  // if (!secret || secret !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized Accessing API' }, { status: 401 });
  // }
  return null;
}

/**
 * Extracts the product URL from the query string
 * @param req  NextApiRequest passed from the handler
 * @returns  the product URL from the query string
 */
const getProductUrl = (req: NextApiRequest): string => {
  const url = req.url! as string 
  const queryString = url.split('?')[1];
  const params = new URLSearchParams(queryString);
  const productUrl = params.get('url');
  return productUrl!;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const headersCheck = checkHeaders(req); 
  if (headersCheck) {
    return headersCheck;
  }
  const productUrl = getProductUrl(req);


  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); // Client must be created inside the handler to avoid serverless function cold starts
    const productDetails = await cheerioScrapeProductDetails(productUrl!);
    const productOptions = await scrapeProductOffers(productUrl!);

    console.log('Product details:', productDetails); 

    if (!productDetails.title) {
      console.error('Failed to scrape product details: Title is missing');
      return NextResponse.json({ error: 'Failed to scrape product details' }, { status: 500 });
    }
    // Deal with product table first, update the Product table with the product details
    const product = await updateProduct(productDetails, supabase);
    
    if (product instanceof NextResponse) { // If the function returns a NextResponse object, it means an error occurred
      return product;
    }
    console.log('Upserted product:', product);
    // Implement update url
    const updateUrl = await upsertURL({ product_id: product.id!, url: productUrl }, supabase);

    // Implement product options as well as their relevant triggers
    const productOptionsList = await updateOptions(productOptions, product.id!, supabase);

    console.log('Product options:', productOptionsList);

     // Implement discount functions as well as their relevant triggers
    const discountData = await triggerDiscountWorkflow(productUrl, supabase);
    if (!discountData) {
      console.error('Data not returned from discount workflow');
      return NextResponse.json({ error: 'Failed to trigger discount workflow' }, { status: 500 });
    }

    // Deal with price by inserting a price related to each option and the current discount
    for (const option of productOptionsList) {
      const priceList = await insertPrice(option.price!, discountData.id!, option.id!, supabase);
      if (priceList instanceof NextResponse) {
        return priceList;
      }
    }



    return NextResponse.json({ product, updateUrl, productOptions, productDetails })

  } catch (error) {
    console.error('Error during scrape process:', error);
   
  }
}
