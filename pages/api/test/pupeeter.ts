import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

interface ProductOption {
  mass: string;
  dataOptionId: string;
}

export interface PriceMassTag {
  option: string;
  price: string;
  productId?: string;
}

const getProductUrl = (req: NextApiRequest): string => {
  const url = req.url! as string;
  const queryString = url.split('?')[1];
  const params = new URLSearchParams(queryString);
  const productUrl = params.get('url');
  return productUrl!;
};



export const scrapeButtonOptions = async (url: string): Promise<ProductOption[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const options = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.athenaProductVariations_box'));
    return buttons.map(btn => ({
      mass: btn.textContent?.trim() || '',
      dataOptionId: btn.getAttribute('data-option-id') || ''
    }));
  });

  await browser.close();
  return options;
};


const delay = (time: number) => new Promise(resolve => setTimeout(resolve, time));



export const puppeteerScrapeProductDetails = async (url: string): Promise<PriceMassTag[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const getPrice = async (): Promise<string> => {
    return await page.evaluate(() => {
      const priceElement = document.querySelector('.productPrice_price[data-product-price="price"]');
      return priceElement ? priceElement.textContent?.trim() : '';
    }) as string;
  };

  const clickButtonById = async (dataOptionId: string): Promise<void> => {
    await page.evaluate((dataOptionId) => {
      const button = document.querySelector(`.athenaProductVariations_box[data-option-id="${dataOptionId}"]`) as HTMLButtonElement;
      if (button) {
        button.click();
      }
    }, dataOptionId);
    await delay(2000); // Wait for the price to update
  };

  const getProductId = async (): Promise<string> => {
    return await page.evaluate(() => {
      const productElement = document.querySelector('.productPrice[data-component="productPrice"]');
      return productElement ? productElement.getAttribute('data-product-id') || '' : '';
    }) as string;
  };

  const sanitizeMass= (option: string): string => {
    const match = option.match(/(\d+(?:\.\d+)?\s*(kg|g))/i);
    return match ? match[0] : option;
  };

  const productOptions = await scrapeButtonOptions(url);
  const priceMassTags: PriceMassTag[] = [];

  for (const option of productOptions) {
    await clickButtonById(option.dataOptionId);
    const price = await getPrice();
    const productId = await getProductId();


    priceMassTags.push({
      option: sanitizeMass(option.mass),
      price,
      productId
    });
  }

  await browser.close();
  return priceMassTags;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const productUrl = getProductUrl(req);
  try {
    const items = await puppeteerScrapeProductDetails(productUrl).then((data) => {
      console.log('Scraped data:', data);
      return data;
    });
    
    res.status(200).json({
      message: "Success",
      data: items
    });
  } catch (error) {
    console.error('Error during scrape process:', error);
    res.status(500).json({
      message: "Error during scrape process",
    });
  }
}
