
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { IncomingHttpHeaders } from 'http';
import { cheerioScrapeProductDetails, updateProduct } from '@/backend/api/product';
import { insertPrice } from '@/backend/api/price';

export const runtime = 'edge';


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
  const secret = headers?.get('cron-secret');

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized Accessing API' }, { status: 401 });
  }
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

 

    // Deal with price table which has a foreign key to product table (dependent), get all prices related to product
    const priceList = await insertPrice(productDetails.price, product.id!, productDetails.discount_percentage, supabase);
    if (priceList instanceof NextResponse) {
      return priceList;
    }

    return NextResponse.json({ product, priceList, productDetails })

  } catch (error) {
    console.error('Error during scrape process:', error);
   
  }
}
