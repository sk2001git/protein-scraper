import * as cheerio from 'cheerio';
/**
 * Function to detect if a page number is invalid.
 * @param html - The HTML content of the page.
 * @returns boolean - True if the page number is invalid, false otherwise.
 */
export function isInvalidPageNumber(html: string): boolean {
  const $ = cheerio.load(html);
  const searchTipsText = $('body').text().toLowerCase();

  return searchTipsText.includes('use our search tips & try again') &&
         searchTipsText.includes('the item you are looking for might have been discontinued');
}

/**
 * Function to detect if a URL is invalid.
 * @param html - The HTML content of the page.
 * @returns boolean - True if the URL is invalid, false otherwise.
 */
export function isInvalidUrl(html: string): boolean {
  const $ = cheerio.load(html);
  const errorText = $('body').text().toLowerCase();

  return errorText.includes('this page can\'t be found') &&
         errorText.includes('it\'s either been removed from this location, or the url is wrong');
}


