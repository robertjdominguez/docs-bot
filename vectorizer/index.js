import { crawl } from './crawler/crawler.js';
import { config } from 'dotenv';
config();

const crawlerResults = crawl(process.env.PATHNAME);
