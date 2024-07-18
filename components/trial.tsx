"use client";
import { useState } from 'react';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.error || 'Failed to fetch data');
      // }

      // setResult(data);
    } catch (err:any ) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h1>Scrape Product Details</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter product URL"
      />
      <button onClick={handleScrape} disabled={loading}>
        {loading ? 'Scraping...' : 'Scrape'}
      </button>
      {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
      {/* {result && (
        <div>
          <h2>Scraped Product Details</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
};

export default Home;