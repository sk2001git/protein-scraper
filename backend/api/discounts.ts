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

    const eventMatch = discountText.match(/USE CODE \[([^\]]+)\] (.*)/);
    const event_name = eventMatch ? `${eventMatch[1]} - ${eventMatch[2]}` : '';

    return {
      discount_percentage,
      event_name,
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
};

const getExistingDiscount = async (event_name: string, supabase: SupabaseClient ): Promise<DiscountDetails | null> => {
  const { data, error } = await supabase
    .from('discounts')
    .select('id, event_name, discount_percentage, created_at')
    .eq('event_name', event_name)
    .single();
  if (error && error.code === 'PGRST116') {
    return null; // No existing discount
  } else if (error) {
    throw error; // Other errors
  }
  return data;
}


