import { client } from '../weaviate.js';
import { config } from 'dotenv';
import OpenAI from 'openai';

config();

const openai = new OpenAI.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// function to add our documents to Weaviate
const addDocuments = async (className, data) => {
  let batcher = client.batch.objectsBatcher();
  let counter = 0;
  const batchSize = 100;

  for (const document of data) {
    console.log(document);
    const obj = {
      class: className,
      properties: { ...document },
    };

    batcher = batcher.withObject(obj);
    if (counter++ == batchSize) {
      await batcher.do();
      counter = 0;
      batcher = client.batch.objectsBatcher();
    }
  }

  const res = await batcher.do();
  return res;
};

// function to vectorize our documents
async function vectorize(className, data) {
  let newDocuments;

  try {
    // transform the id into <className>_id to avoid conflicts since weaviate reserves the id field
    data.forEach((document) => {
      document[`${className}_id`] = document.id;
      delete document.id;
    });

    const classObj = {
      class: className,
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'ada',
          modelVersion: '002',
          type: 'text',
        },
      },
    };

    try {
      const schema = await client.schema.classCreator().withClass(classObj).do();
      if (schema) {
        console.log(`✅ Schema created ${schema}`);
      }
    } catch (err) {
      console.error(`❌ schema already exists`);
    }

    console.log(`⏲️ Adding ${data.length} documents to ${className} class`);
    newDocuments = await addDocuments(className, data);

    // Look at those vectors 👀
    console.log(newDocuments);
  } catch (err) {
    console.error(err.message);
  }
  return newDocuments;
}

// near_text search
const nearText = async (className, fields, text) => {
  fields = fields.join(' ');
  try {
    const res = await client.graphql
      .get()
      .withClassName(className)
      .withFields(fields)
      .withNearText({ concepts: [`${text}`] })
      .withLimit(2)
      .do();
    return res;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const LLMQuery = async (ws, className, fields, text, messages) => {
  try {
    const embeddings = await nearText(className, fields, text);

    function makePrompt(embeddings) {
      let embeddingString = '';
      embeddings.data.Get.Pages.map((embedding) => {
        embeddingString += `${embedding.title}\n${embedding.body}\n\n`;
      });
      let promptText = `\n\n${embeddingString}`;
      return promptText;
    }

    let conversation = [
      {
        role: 'system',
        content: `You are a helpful AI assistant tasked with assisting users use ${
          process.env.PRODUCT_NAME
        }. If you don't know an answer, you should not make one up. Don't invent information that isn't present in the provided documentation or previous messages. Limit answers to four sentences unless explicitly asked for detail. Use the following information from the documentation to help the user with their question: ${makePrompt(
          embeddings
        )})}`,
      },
    ];

    // Check if the messages array is provided and not empty
    if (messages && messages.length > 0) {
      conversation.push(...messages);
    }

    // Add the user's question to the end of the conversation array
    conversation.push({
      role: 'user',
      content: text,
    });

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversation,
      stream: true,
    });

    let reply = '';

    for await (const chunk of chatCompletion) {
      reply += chunk.choices[0].delta.content;
      ws.send(chunk.choices[0].delta.content);
    }

    const assistantReply = reply;

    conversation.push({
      role: 'assistant',
      content: assistantReply,
    });

    // Send responses to the WebSocket connection
    const response = {
      pastMessages: conversation,
    };

    ws.send(JSON.stringify(response));
  } catch (err) {
    console.error(err);
    ws.send(JSON.stringify({ error: err.message }));
  }
};

// function to capitalize the first letter of tables
const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// function to delete a class from Weaviate
const deleteClass = async (className) => {
  try {
    const schema = await client.schema.classDeleter().withClassName(className).do();
    console.log(`✅ Schema deleted ${className}`);
  } catch (err) {
    console.error(`❌ schema does not exist`);
  }
};

export { vectorize, deleteClass, nearText, capitalize, LLMQuery };
