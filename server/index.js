import { config } from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import { vectorize, nearText, deleteClass, capitalize, LLMQuery } from './utilities/weaviateHelpers.js';
import { showColumns } from './utilities/showHelpers.js';
import { db } from './pg.js';

config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const { app: wsApp } = expressWs(app);

// show all available tables
app.get('/show_tables', (req, res) => {
  db.query('SELECT * FROM information_schema.tables WHERE table_schema = $1', ['public'], (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      res.send(error);
    } else {
      console.log('Query results:', results.rows);
      res.json(results.rows);
    }
  });
});

// show columns' names and types of a table
app.get('/show_columns/:table', (req, res) => {
  const table = req.params.table;
  db.query('SELECT * FROM information_schema.columns WHERE table_name = $1', [table], (error, results) => {
    let columns;
    if (error) {
      console.error('Error executing query:', error);
      res.send(error);
    } else {
      columns = showColumns(results.rows);
      console.log('Query results:', columns);
    }
    res.json(columns);
  });
});

// show all data from a table
app.get('/show_data/:table', (req, res) => {
  const table = req.params.table;
  const query = `SELECT * FROM ${table}`;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Query results:', results.rows);
      res.json(results.rows);
    }
  });
});

// vectorize a table and all its rows
app.get('/vectorize/:table', async (req, res) => {
  const table = req.params.table;
  const query = `SELECT * FROM ${table}`;

  try {
    const results = await new Promise((resolve, reject) => {
      db.query(query, (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error);
        } else {
          resolve(results.rows);
        }
      });
    });

    const statusMessage = `Vectorizing ${results.length} rows from ${table}`;
    console.log(statusMessage);
    const vectorizedData = await vectorize(table, results);

    res.json({
      data: vectorizedData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// make a near_text query to Weaviate
app.post('/near_text', async (req, res) => {
  if (!req.body.columns || !req.body.query || !req.body.table) {
    return res.status(400).json({ error: 'An object with table, columns, and a query are required.' });
  }

  const columns = req.body.columns;
  let searchText = req.body.query;
  const className = capitalize(req.body.table);

  let columnsArray = columns.split(',').map((field) => field.trim());

  const results = await nearText(className, columnsArray, searchText);
  res.json({ results });
});

// make an LLM query to Weaviate
wsApp.ws('/llm', async (ws, request) => {
  ws.on('message', (message) => {
    // Parse incoming message as JSON
    try {
      const data = JSON.parse(message);

      // Check if the message is a valid request
      if (!data.columns || !data.query || !data.table) {
        ws.send(JSON.stringify({ error: 'An object with table, columns, and a query are required.' }));
        return;
      }

      const columns = data.columns;
      let searchText = data.query;
      const messages = data.messages;
      const className = capitalize(data.table);

      let columnsArray = columns.split(',').map((field) => field.trim());

      // Perform your LLMQuery here and send results to the WebSocket
      LLMQuery(ws, className, columnsArray, searchText, messages)
        .then((results) => {
          ws.send(JSON.stringify({ results }));
        })
        .catch((error) => {
          ws.send(JSON.stringify({ error: error.message }));
        });
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid JSON message' }));
    }
  });
});

// delete a class in Weaviate
app.get('/delete_class/:className', async (req, res) => {
  const className = capitalize(req.params.className);
  try {
    await deleteClass(className);
    res.json({
      message: `Class ${className} deleted`,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
