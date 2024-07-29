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

export interface DiscountDetails {
  id?: number;
  event_name: string;
  discount_percentage: number;
  created_at?: string;
}

interface ScrapedInformation {
  productDetails: ProductDetails;
  priceOptions: PriceOption[];
  discountDetails: DiscountDetails;
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
    { onConflict: 'name', ignoreDuplicates: false }
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

export const scrapeAllInformation = async (url: string): Promise<ScrapedInformation> => {
  const start = performance.now();

  try {
    const startGet = performance.now();
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const startEnd = performance.now();
    console.log(`Cheerio load time: ${startEnd - startGet} milliseconds`);

    // Scrape product details
    const title = $('h1.productName_title').first().text().trim();
    const subtitle = $('p.productName_subtitle').first().text().trim();
    const before_discount = $('p.productPrice_rrp.productPrice_rrp_colour').first().text().trim() || '0.00';
    const save = $('productPrice_savingAmount.productPrice_savingAmount_colour').first().text().trim() || '0.00';
    const price = $('p.productPrice_price').text().trim();

    // Scrape discount details
    const discountText = $('.stripBanner_text').text().trim();
    const discountMatch = discountText.match(/(\d+)% OFF/);
    const discount_percentage = discountMatch ? parseInt(discountMatch[1], 10) : 0;
    const eventMatch = discountText.match(/CODE【([^】]+)】/);
    const event_name = eventMatch ? eventMatch[1] : '';

    const productDetails: ProductDetails = {
      title,
      subtitle,
      before_discount,
      save,
      price,
      discount_percentage,
    };

    const discountDetails: DiscountDetails = {
      discount_percentage,
      event_name,
    };

    // Parse product schema
    const productSchemaScript = $('#productSchema').html();
    if (!productSchemaScript) {
      throw new Error('Product schema script not found');
    }

    const productSchema: ProductSchema = JSON.parse(productSchemaScript);

    const priceOptions: PriceOption[] = productSchema.hasVariant.map(variant => ({
      name: variant.name,
      dataOptionsId: parseInt(variant['@id']),
      price: variant.offers.price,
    }));

    if (productSchema.productGroupID) {
      productDetails.id = parseInt(productSchema.productGroupID);
    }

    return {
      productDetails,
      priceOptions,
      discountDetails,
    };

  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  } finally {
    const end = performance.now();
    console.log(`Scraping execution time: ${end - start} milliseconds`);
  }
};
/**
 * Updates the options table for the product
 * @param options  The options to be updated
 * @param productId The ID of the product
 * @param supabase  The Supabase client 
 * @returns  The updated options else a NextResponse denoting an error
 */
export const updateOptions = async (options: PriceOption[], productId: number, supabase: SupabaseClient): Promise<Options[]> => {
  const seen = new Set<string>();
  
  // Filter options to remove duplicates based on combination of option.name and option.dataOptionsId
  const uniqueOptions = options.filter(option => {
    const key = `${productId}-${option.name}-${option.dataOptionsId}`;
    if (seen.has(key)) {
      return false; 
    }
    seen.add(key); 
    return true;
  });


  const upsertData = uniqueOptions.map(option => ({
    product_id: productId,
    option_type: option.name,
    data_option_id: option.dataOptionsId,
  }));
  
  const { data: unused , error } = await supabase
    .from('product_options')
    .upsert(upsertData, { onConflict: 'product_id, option_type', ignoreDuplicates: true })

  const { data, error: fetchError } = await supabase
    .from('product_options')
    .select('id, product_id, option_type, data_option_id')
    .eq('product_id', productId);

  if (error) {
    console.error('Error upserting options:', error);
    throw error;
  }

  const results: Options[] = [];
  if (data) {
    data.forEach((item: any) => {
      for (const option of options) {
        if (item.option_type === option.name && item.data_option_id === option.dataOptionsId) {
          results.push({
            id: item.id,
            product_id: item.product_id,
            option_type: item.option_type,
            data_option_id: item.data_option_id,
            price: option.price,
          });
        }
      }
    });
  }

  return results || [];
}