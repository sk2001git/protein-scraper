import axios from 'axios';
import * as cheerio from 'cheerio';
import { isInvalidPageNumber, isInvalidUrl } from './invalid_page';
import { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export interface ProductCard {
  name: string;
  url: string;
  data_option_id: string;
}

/**
 * Scrapes the product list page and returns a list of ProductCard objects
 * @param url The URL of the product list page
 * @returns A promise that resolves to an array of ProductCard objects
 */
export const scrapeProductInProductList = async (url: string, supabase: SupabaseClient): Promise<ProductCard[]> => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    if (isInvalidPageNumber(data) || isInvalidUrl(data)) {
      console.log(`Invalid page detected for URL ${url}. Skipping this URL.`);
      if (isInvalidUrl(data)) {
        await deleteInvalidUrl(supabase, url);
      }
      return [];
    }

    const productList = $('ul.productListProducts_products');
    let products: ProductCard[] = [];

    productList.find('li.productListProducts_product').each((index, element) => {
      const product = extractProductDetails($, element, url);
      if (product) {
        products.push(product);
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
};

/**
 * Extracts product details from a cheerio element
 * @param $ The cheerio instance
 * @param element The cheerio element representing a product
 * @param baseUrl The base URL of the product list page
 * @returns A ProductCard object or null if extraction fails
 */
const extractProductDetails = ($: cheerio.CheerioAPI, element: cheerio.Element, baseUrl: string): ProductCard | null => {
  const productNameTag = $(element).find('h3.productBlock_productName');
  const productLinkTag = $(element).find('a.productBlock_link');

  if (productNameTag.length && productLinkTag.length) {
    const name = productNameTag.text().trim();
    const productRelativeUrl = productLinkTag.attr('href');
    if (!productRelativeUrl) return null;

    const url = new URL(productRelativeUrl, baseUrl).href;
    const data_option_id = productRelativeUrl.split('/').pop()?.split('.')[0] ?? '';

    if (name && url && data_option_id) {
      return { name, url, data_option_id };
    }
  }

  return null;
};

/**
 * Deletes an invalid URL from the category_urls table in Supabase
 * @param supabase The Supabase client instance
 * @param url The URL to be deleted
 */
const deleteInvalidUrl = async (supabase: SupabaseClient, url: string): Promise<void> => {
  const { error } = await supabase
    .from('category_urls')
    .delete()
    .eq('url', url);

  if (error) {
    console.error(`Error deleting URL ${url} from category_urls: ${error.message}`);
  } else {
    console.log(`Successfully deleted URL ${url} from category_urls`);
  }
};