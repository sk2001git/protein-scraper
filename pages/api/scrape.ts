
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server'
import { IncomingHttpHeaders } from 'http';

export const runtime = 'edge';

interface ProductDetails {
  title: string;
  subtitle: string;
  before_discount: string;
  save: string;
  price: string;
  discount_percentage: number;
}

const cheerioScrapeProductDetails = async (url: string): Promise<ProductDetails> => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $('h1.productName_title').first().text().trim();
    const subtitle = $('p.productName_subtitle').first().text().trim();
    const before_discount = $('p.productPrice_rrp.productPrice_rrp_colour').first().text().trim() || '0.00';
    const save = $('productPrice_savingAmount.productPrice_savingAmount_colour').first().text().trim() || '0.00';
    const price = $('p.productPrice_price').text().trim();
    const choices: string[] = [];
    $('select#athena-product-variation-dropdown-5 option').each((index, element) => {
      choices.push($(element).text().trim());
    });

    const discountText = $('.stripBanner_text').find('p').text().trim();
    const discountMatch = discountText.match(/(\d+)% OFF/);
    const discount_percentage = discountMatch ? parseInt(discountMatch[1], 10) : 55;

    return {
      title,
      subtitle,
      before_discount,
      save,
      price,
      discount_percentage,
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return NextResponse.json({error: 'Method Not Allowed'}, { status: 405 });
  }
  const url = req.url! as string // Might need to decode if u decide to fetch from client component
  
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }  
  const headers = req.headers as IncomingHttpHeaders;
  //@ts-ignore: Despite using the headers type as well as optional chaining, TypeScript still complains about the type of headers.get
  const secret = headers?.get('cron-secret');

  console.log('Received cron-secret:', secret); // Debugging statement
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized Accessing API' }, { status: 401 });
  }

  
  const queryString = url.split('?')[1];
  const params = new URLSearchParams(queryString);
  const productUrl = params.get('url');


  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const productDetails = await cheerioScrapeProductDetails(productUrl!);

    console.log('Product details:', productDetails);

    if (!productDetails.title) {
      console.error('Failed to scrape product details: Title is missing');
      return NextResponse.json({ error: 'Failed to scrape product details' }, { status: 500 });
    }

    const { data: product, error: upsertError, status: upsertStatus } = await supabase
      .from('product')
      .upsert(
        {
          name: productDetails.title,
          description: productDetails.subtitle,
          updatedat: new Date()
        },
        { onConflict: 'name' }
      )
      .select()
      .single();


    if (upsertError) {
      console.error('Error upserting product:', upsertError);
      return NextResponse.json({ error: 'Failed to upsert product', details: upsertError.message, status: upsertStatus }, { status: 500 });
    }

    console.log('Upserted product:', product);

    const { data: price, error: insertError, status: insertStatus } = await supabase
      .from('price')
      .insert({
        price: parseFloat(productDetails.price.replace(/[^0-9.-]+/g, "")),
        productid: product.id,
        discount_percentage: productDetails.discount_percentage,
      })
      .select();

    if (insertError) {
      console.error('Error inserting price:', insertError);
      return NextResponse.json({ error: 'Failed to insert price', details: insertError.message, status: insertStatus }, { status: 500 });
    }


    return NextResponse.json({ product, price, productDetails })
  } catch (error) {
    console.error('Error during scrape process:', error);
   
  }
}
