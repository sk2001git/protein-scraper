import { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json({
      message: "Success",
      // data: items
    });
  } catch (error) {
    console.error('Error during scrape process:', error);
    res.status(500).json({
      message: "Error during scrape process",
    });
  }
}
