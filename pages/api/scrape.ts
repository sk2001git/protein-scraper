import { NextApiRequest, NextApiResponse } from 'next';
import { firecrawl_scrape } from '@/backend/scraping';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body;

    try {
      const result = await firecrawl_scrape(url);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to scrape' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    res.status(200).json({ message: 'Scraping completed successfully' });
  }
}

