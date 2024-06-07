// Basically there are a couple of things when use express with nextjs
// configure package.json to run nodemon, essentially nodemon is like running node server with hot reload
const express = require('express');
const next = require('next');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('./server'); // Adjust the path as needed


const PORT = 8080;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev }); // Setting up with nextjs settings
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express' });
  });

  server.get('/api/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      const productDetails = await cheerioScrapeProductDetails(url);
      const product = await prisma.product.upsert({
        where: { name: productDetails.title },
        update: {
          description: productDetails.subtitle,
          updatedAt: new Date(),
        },
        create: {
          name: productDetails.title,
          description: productDetails.subtitle,
          prices: {
            create: {
              price: parseFloat(productDetails.price.replace(/[^0-9.-]+/g, "")),
            }
          }
        },
        include: { prices: true }
      });

      res.json(product);
      res.json(productDetails);
    } catch (error) {
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
    // Fetch the web page content
    const { data } = await axios.get(url);

    // Load the HTML content into cheerio
    const $ = cheerio.load(data);

    // Extract the product title
    const title = $('h1.productName_title').first().text().trim();
    console.log(title);
    const subtitle = $('p.productName_subtitle').first().text().trim();
    console.log(subtitle);

    // Extract the product price
    const before_discount = $('p.productPrice_rrp.productPrice_rrp_colour').first().text().trim() || '0.00';
    const save = $('productPrice_savingAmount productPrice_savingAmount_colour').first().text().trim() || '0.00';
    const price = $('p.productPrice_price').text().trim();

    // Extract the product choices
    const choices = [];
    $('select#athena-product-variation-dropdown-5 option').each((index, element) => {
      choices.push($(element).text().trim());
    });
    console.log("Success, product details scraped");

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