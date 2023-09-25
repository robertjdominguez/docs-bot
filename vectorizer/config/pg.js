import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
config();

const connectionString = process.env.POSTGRESQL_CONNECTION_STRING;

const db = new Pool({
  connectionString: connectionString,
});

async function getCategoryId(categoryName) {
  const categoryIdQuery = {
    text: 'SELECT id FROM categories WHERE name = $1',
    values: [categoryName],
  };
  const categoryId = await db.query(categoryIdQuery);
  return categoryId.rows[0].id;
}

export { db, getCategoryId };
