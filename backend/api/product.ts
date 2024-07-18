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

interface ProductSchema {
  '@type': string;
  '@context': string;
  productGroupID: string;
  variesBy: any[];
  name: string;
  brand: { '@type': string; name: string };
  description: string;
  url: string;
  hasVariant: Product[];
  review: any[];
}

interface Product {
  '@type': string;
  '@context': string;
  '@id': string;
  sku: string;
  mpn: string;
  name: string;
  description: string;
  offers: Offer;
  image: string;
}

interface Offer {
  '@type': string;
  price: string;
  priceCurrency: string;
  url: string;
  itemCondition: string;
  sku: string;
  availability: string;
}

interface PriceOption {
  name: string,
  dataOptionsId: number,
  price: string,
}

interface Options {
  id?: number;
  product_id: number;
  option_type: string;
  data_option_id: number;
  price: string;
}



/**
 * Scrapes the information currently from the product page for my-protein specifcally
 * @param url 
 * @returns Details of the product scraped from the product page which includes the title, subtitle, before_discount, save, price and discount_percentage
 */
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


/**
 * Update the existing product details 
 * @param productDetails  The details of the product to be updated 
 * @param supabase 
 * @returns The updated product details else a NextResponse denoting an error 
 */
export const updateProduct = async (productDetails: ProductDetails, url_id: number, supabase: SupabaseClient): Promise<NextResponse | ProductDetails> => {
  const { data: product, error: upsertError, status: upsertStatus } = await supabase
  .from('product')
  .upsert(
    {
      name: productDetails.title,
      description: productDetails.subtitle,
      updatedat: new Date(),
      url_id: url_id,
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

/**
 * Scrapes the product schema from the product page
 * @param url The URL of the product page
 * @returns The product schema
 */
export const scrapeProductOffers = async (url: string): Promise<PriceOption[]> => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const productSchemaScript = $('#productSchema').html();

    if (!productSchemaScript) {
      throw new Error('Product schema script not found');
    }

    const productData: ProductSchema = JSON.parse(productSchemaScript);

    const productsWithOffers = productData.hasVariant.map(product => {
      return {
        name: product.name,
        id: product['@id'],
        offers: product.offers,
        price: product.offers.price,
      };
    });

    // Log the extracted product IDs and their offers
    // console.log(productsWithOffers);
    if (!productsWithOffers) {
      console.log('No products with offers found');
      return [];
    }
    return productsWithOffers.map((product) => {
      return {
        name: product.name,
        dataOptionsId: parseInt(product.id),
        price: product.price,
      };
    });
  } catch (error) {
    console.error('Error scraping product data:', error);
    throw error;
  }
}

/**
 * Updates the options table for the product
 * @param options  The options to be updated
 * @param productId The ID of the product
 * @param supabase  The Supabase client 
 * @returns  The updated options else a NextResponse denoting an error
 */
export const updateOptions = async (options: PriceOption[], productId: number, supabase: SupabaseClient): Promise<Options[]> => {
  const results: Options[] = [];

  for (const option of options) {
    const { data, error, status } = await supabase
      .from('product_options')
      .upsert(
        {
          product_id: productId,
          option_type: option.name,
          data_option_id: option.dataOptionsId,
        },
        { onConflict:'product_id, option_type' }
      )
      .select('id, product_id, option_type, data_option_id');


    if (error) {
      console.error('Error upserting options:', error);
      throw error;
    }
    if (data) {
      const updatedData = data.map((item: any) => ({
        ...item,
        price: option.price,
      }));
      results.push(...updatedData);
    }
  }
  
  return results;
}