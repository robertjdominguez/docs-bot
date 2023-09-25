import { crawl } from './crawler/crawler.js';
import { config } from 'dotenv';
config();

const crawlerResults = await crawl(process.env.PATHNAME);

// hit the vectorizer endpoint with the categories and pages tables
async function vectorize() {
  const catResponse = await fetch(`http://${process.env.SERVER_BASE_URL}/vectorize/categories`);
  const catData = await catResponse.json();
  console.log(catData);

  const pageResponse = await fetch(`http://${process.env.SERVER_BASE_URL}/vectorize/pages`);
  const pageData = await pageResponse.json();
  console.log(pageData);
}

const vectorizeResults = await vectorize();
