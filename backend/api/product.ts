import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
/**
 * Scrapes the information currently from the product page for my-protein specifcally
 * @param url The URL of the product page
 * @returns data scraped from the product page of the type ProductDetails
 */

interface ProductDetails {
  id? : number;
  title: string;
  subtitle: string;
  before_discount: string;
  save: string;
  price: string;
  discount_percentage: number;
}

export const cheerioScrapeProductDetails = async (url: string): Promise<ProductDetails> => {
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

export const updateProduct = async (productDetails: ProductDetails, supabase: SupabaseClient): Promise<NextResponse | ProductDetails> => {
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
  return product;
};