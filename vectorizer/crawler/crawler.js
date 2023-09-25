import { db, getCategoryId } from '../config/pg.js';
import { getDirectories, getPagesInADirectory, shapeData } from './utilities.js';

const createCategories = async (directory) => {
  const categories = getDirectories(directory);

  console.log(categories);

  // Use Promise.all to await all category insertions in parallel
  await Promise.all(
    categories.map(async (category) => {
      const query = {
        text: 'INSERT INTO categories (name) VALUES ($1)',
        values: [category],
      };
      try {
        const addCategory = await db.query(query);
        if (addCategory) {
          console.log(`✅ Added ${category} to PostgreSQL.`);
        }
      } catch (error) {
        if (error.code === '23505') {
          console.log(`⏩ ${category} already exists in the database. Skipping duplicate.`);
        } else {
          console.error(error);
        }
      }
    })
  );

  // Pause for five seconds
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return categories;
};

const addPages = async (directory, categories) => {
  categories.map(async (category) => {
    const pages = getPagesInADirectory(`${directory}/${category}`);
    pages.map(async (page) => {
      const categoryId = await getCategoryId(category);
      const details = await shapeData(page);
      const query = {
        text: `
          INSERT INTO pages (category_id, title, keyword, body, path)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (category_id, title) DO UPDATE
          SET keyword = EXCLUDED.keyword, body = EXCLUDED.body, path = EXCLUDED.path
        `,
        values: [categoryId, details.title, details.keyWords, details.text, details.path],
      };
      try {
        const addPage = await db.query(query);
        if (addPage) {
          console.log(`✅ Added ${page} to ${category}.`);
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
};

async function crawl(directory) {
  // wait five seconds to start
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const categories = await createCategories(directory);
  addPages(directory, categories);
}

export { crawl };
