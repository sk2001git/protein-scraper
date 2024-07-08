import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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
interface ProductOption {
  mass: string;
  variationId: string;
}

export interface PriceMassTag {
  option: string;
  price: string;

}

interface ExpandedProductDetails extends ProductDetails {
  choices: ProductOption[];
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

export const scrapeButtonOptions = async (url: string): Promise<ProductOption[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const options = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.athenaProductVariations_listItem button')).map((button) => ({
      mass: (button.textContent?.split('\n')[0] || '').trim(),
      variationId: button.getAttribute('data-variation-id') || ''
    }));
  });

  await browser.close();
  return options;
};

function delay(time: number) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

export const puppeteerScrapeProductDetails = async (url: string): Promise<PriceMassTag[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Scrape button options
  const options = await scrapeButtonOptions(url);
  let optionsArray: PriceMassTag[] = [];

  // Iterate over product options to fetch prices
  for (let option of options) {
    const { mass, variationId } = option;
    if (variationId) {
      await page.click(`button[data-variation-id="${variationId}"]`);
      
      // Reload the page
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      
      // Wait for 2 seconds to allow the page to fully load
      await delay(2000);

      // Scrape the updated price
      const optionPrice = await page.evaluate(() => {
        const priceElement = document.querySelector('.athenaProductPage_productPrice_top .productPrice_price');
        return priceElement ? priceElement.textContent?.trim() : '';
      });

      optionsArray.push({ option: mass, price: optionPrice! });
    }
  }

  await browser.close();
  return optionsArray;
};

/**
 * Update the existing product details 
 * @param productDetails  The details of the product to be updated 
 * @param supabase 
 * @returns The updated product details else a NextResponse denoting an error 
 */
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