"use client";
import { ScrapeResult } from '@/backend/scraping';
import { jira_scrape } from '@/backend/scraping';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  // const [response, setResponse] = useState<ScrapeResult | null>(null);
  // const [response, setResponse] = useState<ProductDetails | null>(null); // [1
  const [loading, setLoading] = useState(false);

  // const handleScrape = async () => {
  //   setLoading(true);
  //   try {
  //     const url = "https://www.myprotein.com.sg/sports-nutrition/performance-cookie/10530674.html?variation=10637004";
  //     const responseData = await axios.post('http://localhost:3000/scrape', { url });

  //     //const responseData: ProductDetails = await cheerioScrapeProductDetails(url);
  //     console.log('Scraped data:', responseData);
  //     setResponse(responseData.data);
  //     console.log('Scraping completed successfully');
  //   } catch (error: any) {
  //     console.error('Failed to scrape:', error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div>
      <h1>Scrape URL</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
      {/* <button onClick={handleScrape} disabled={loading}>
        {loading ? 'Loading...' : 'Scrape'}
      </button>
      {response ? (
        <pre>{JSON.stringify(response, null, 2)}</pre>
      ) : (
        <p>No data to display</p>
      )} */}
    </div>
  );
}