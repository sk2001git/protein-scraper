"use server";

import FirecrawlApp from '@mendable/firecrawl-js';
import { ScrapeResponse } from '@mendable/firecrawl-js';
import Error from 'next/error';

const axios = require('axios');
export const runtime = 'edge';

export interface ScrapeResult {
  url: string;
  content: ScrapeResponse;
}


export async function firecrawl_scrape(url: string): Promise<ScrapeResult> {
  // Take note that for the process.env to work, its important to add to next.config ur environment variables, refer to next.config for this
  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

  try {
    const scrapedData = await app.scrapeUrl(url);
    console.log('Scraped data:', scrapedData);
    return {
      url,
      content: scrapedData,
    }
  
  } catch (error) {
    console.error('There is an error in scraping', error);
    throw error as Error;
  }
}

export async function jina_scrape(url: string): Promise<ScrapeResult> {
  try {
    const response = await axios.get(`https://r.jina.ai/${url}`);
    return {
      url,
      content: response.data
    };
  } catch (error) {
    console.error('There is an error in scraping', error);
    throw error as Error;
  }
 
}

