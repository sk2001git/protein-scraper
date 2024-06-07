// Basically there are a couple of things when use express with nextjs
// configure package.json to run nodemon, essentially nodemon is like running node server with hot reload
// To use import, we need to set   "type": "commonjs" in package.json
import express from 'express';
import next from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js'

const PORT = 8080;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev }); // Next settings
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  server.get('/api/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      console.log(`Scraping URL: ${url}`);
      const productDetails = await cheerioScrapeProductDetails(url);
      console.log('Product details:', productDetails);

      if (!productDetails.title) {
        console.error('Failed to scrape product details: Title is missing');
        return res.status(500).json({ error: 'Failed to scrape product details' });
      }
      // Upsert product just means insert if not exist
      // TODO: Supabase lower caps all fields and table name when creating via sql. Be aware!!!
      const { data: product, error: upsertError, status: upsertStatus } = await supabase
        .from('product')
        .upsert(
          {
            name: productDetails.title,
            description: productDetails.subtitle,
            updatedat: new Date()
          },
          { onConflict: ['name'] }
        )
        .select()
        .single();

      console.log("Product id", product.id);


      if (upsertError) {
        console.error('Error upserting product:', upsertError);
        return res.status(500).json({ error: 'Failed to upsert product', details: upsertError.message, status: upsertStatus });
      }

      console.log('Upserted product:', product);
      // TODO: SUPABASE lower caps everything if created using sql code. 
      const { data: price, error: insertError, status: insertStatus } = await supabase
        .from('price')
        .insert({
          price: parseFloat(productDetails.price.replace(/[^0-9.-]+/g, "")),
          productid: product.id,
        })
        .select();

      if (insertError) {
        console.error('Error inserting price:', insertError);
        return res.status(500).json({ error: 'Failed to insert price', details: insertError.message, status: insertStatus });
      }

      console.log('Inserted price:', price);

      res.json({ product, price, productDetails });
    } catch (error) {
      console.error('Error during scrape process:', error);
      res.status(500).json({ error: 'Failed to scrape the URL' });
    }
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

async function cheerioScrapeProductDetails(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $('h1.productName_title').first().text().trim();
    const subtitle = $('p.productName_subtitle').first().text().trim();
    const before_discount = $('p.productPrice_rrp.productPrice_rrp_colour').first().text().trim() || '0.00';
    const save = $('productPrice_savingAmount productPrice_savingAmount_colour').first().text().trim() || '0.00';
    const price = $('p.productPrice_price').text().trim();
    const choices = [];
    $('select#athena-product-variation-dropdown-5 option').each((index, element) => {
      choices.push($(element).text().trim());
    });

    return {
      title,
      subtitle,
      before_discount,
      save,
      price,
      choices,
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
}