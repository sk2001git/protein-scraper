import { SupabaseClient } from "@supabase/supabase-js";
import { ProductCard, scrapeProductInProductList } from "./product_card_scraper";

export const runtime = 'edge';


export const scrapeAndReturnAllProductUrls = async (supabase: SupabaseClient): Promise<string[]> => {
  try {
    const { data: categoryUrls, error } = await supabase
      .from('category_urls')
      .select('id, url');
    

    if (error) {
      throw new Error(`Error fetching category URLs: ${error.message}`);
    }

    if (!categoryUrls) {
      throw new Error('No category URLs found');
    }

    let allUrls: string[] = [];

    const baseURL = 'https://www.myprotein.com';
    const filteredCategoryUrls = categoryUrls.filter(({ url }) => {
      const relativeUrl = url.replace(baseURL, '');
      return relativeUrl.includes('protein');
    });
    const visitedUrls = new Set<string>();
    for (const { id, url } of filteredCategoryUrls) {
      if (!visitedUrls.has(url)) {
        visitedUrls.add(url);
        const urls = await scrapeCategory(supabase, id, url);
        allUrls = allUrls.concat(urls);
      }
    }

    return allUrls;
  } catch (error) {
    console.error('Error scraping category URLs:', error);
    throw error;
  }
};

const scrapeCategory = async (supabase: SupabaseClient, categoryId: number, baseUrl: string): Promise<string[]> => {
  let urls: string[] = [];
  let pageNumber = 1;

  while (true) {
    const pageUrl = `${baseUrl}?pageNumber=${pageNumber}`;
    console.log(`Scraping products from URL: ${pageUrl}`);
    
    try {
      const products: ProductCard[] = await scrapeProductInProductList(pageUrl, supabase);
      if (products.length === 0) break; // Stop if no products are found

      for (const product of products) {
        await processProduct(supabase, product, categoryId);
        urls.push(product.url);
      }
      pageNumber++;
    } catch (error) {
      console.error(`Error scraping products from URL ${pageUrl}: ${error}`);
      break;
    }
  }

  return urls;
};

const processProduct = async (supabase: SupabaseClient, product: ProductCard, categoryId: number): Promise<void> => {
  const { data, error } = await supabase
    .from('urls')
    .upsert([
      {
        url: product.url,
        product_id: product.data_option_id,
        category_url_id: categoryId,
        last_scraped_at: new Date(),
      },
    ], { onConflict: 'url' });

  if (error) {
    console.error(`Error updating URL ${product.name}: ${error.message}`);
  } else {
    console.log(`Successfully updated URL ${product.name}: ${product.data_option_id}`);
  }
};
