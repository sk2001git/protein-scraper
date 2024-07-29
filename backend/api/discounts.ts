import { SupabaseClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const runtime = 'edge';

interface DiscountDetails {
  id?: number;
  event_name: string;
  discount_percentage: number;
  created_at?: string;
}

/**
 * Scrapes the information currently from the discount banner of the product page for my-protein specifcally
 * @param url The URL of the product page
 * @returns data scraped from the discount banner of the type DiscountDetails
 */

const cheerioScrapeDiscountDetails = async (url: string): Promise<DiscountDetails> => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const discountText = $('.stripBanner_text').text().trim();

    const discountMatch = discountText.match(/(\d+)% OFF/);
    const discount_percentage = discountMatch ? parseInt(discountMatch[1], 10) : 0;

    const eventMatch = discountText.match(/CODE【([^】]+)】/);
    const event_name = eventMatch ? eventMatch[1] : '';
    console.log(event_name)

    return {
      discount_percentage,
      event_name,
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
};

const getExistingDiscount = async (eventName: string, supabase: SupabaseClient ): Promise<DiscountDetails | null> => {
  const { data, error } = await supabase
    .from('discounts')
    .select('id, event_name, discount_percentage, created_at')
    .eq('event_name', eventName)
    .single();
  if (error && error.code === 'PGRST116') {
    return null; // No existing discount
  } else if (error) {
    throw error; // Other errors
  }
  return data as DiscountDetails;
}

const upsertDiscount = async (eventName: string, discountPercentage: number, supabase: SupabaseClient): Promise<DiscountDetails> => {
  const { data, error } = await supabase
    .from('discounts')
    .upsert([{ event_name: eventName, discount_percentage: discountPercentage }], { onConflict: 'event_name', ignoreDuplicates: false})
    .select('id, event_name, discount_percentage, created_at')
    .single();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Failed to update discount');
  }
  return data as DiscountDetails;
}

/**
 * Triggers the discount flow by scraping the discount details and upserting the discount in the database. Discount object ready to be used for date range creation and event activation
 * @param url The URL of the product page
 * @param supabase The Supabase client
 * @returns The discount details
 */
export const triggerDiscounts = async (url: string, supabase: SupabaseClient, discountDetails: DiscountDetails): Promise<DiscountDetails> => {
  if (!discountDetails.event_name) {
    throw new Error('No event name detected');
  }
  return  upsertDiscount(discountDetails.event_name, discountDetails.discount_percentage, supabase);
}


