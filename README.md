# Docs Bot

## Overview

This is intended to be used as a service for adding an AI assistant to any Docusaurus site. As a user, you can define
the repository you want to use, and the path to the docs you want to use. The service will then crawl the docs, add them
to a PostgreSQL database, and vectorize them using Weaviate. The service will then start a server that can be queried
using ChatGPT to get answers to questions about the docs.

## Installation and Setup

Clone the repository using the following command:

```bash
git clone https://github.com/robertjdominguez/docs-bot.git
```

In the root of the project, create a .env file and add the following:

```bash
POSTGRES_DB=<YOUR_DB_NAME>
POSTGRES_USER=<YOUR_DB_USERNAME>
POSTGRES_PASSWORD=<YOUR_DB_PASSWORD>
POSTGRESQL_CONNECTION_STRING=postgres://<DB_USERNAME>:<DB_PASSWORD>@postgres:5432/<DB_NAME>
WEAVIATE_URL=weaviate:8080
SERVER_BASE_URL=server:3000
OPENAI_API_KEY=<YOUR_OPEN_AI_API_KEY>
GIT_REPO_URL=https://<YOUR_GH_USERNAME>:<YOUR_GH_TOKEN>@github.com/hasura/v3-docs.git
PATHNAME='/vectorizer/<YOUR_GH_REPO_NAME>/<FOLDER_CONTAINING_MDX_FILES>'
```

## Testing

Run `docker compose up -d` to start the server. A series of containers will be started, including a PostgreSQL database,
Weaviate, and the server itself.

Additionally, a service called `vectorizer` will exit on completion after it:

- Clones the docs repo
- Crawls the docs and adds them to the PostgreSQL database
- Creates a Weaviate schema
- Vectorizes the data in PostgreSQL and adds it to Weaviate

You can now query using examples below 👇

### Initial query

With this server running, hit the `localhost:3000/llm` endpoint with a POST request:

```json
{
  "table": "pages",
  "columns": "body, keyword, title, path",
  "query": "What's a model?",
  "messages": []
}
```

### Response from the LLM

Take the response from the LLM and add it to the `messages` array in the request body. Then, add a new question in the
`query` field. As an example:

```json
{
  "table": "pages",
  "columns": "body, keyword, title, path",
  "query": "What's required for me to use one?",
  "messages": [
    {
      "role": "user",
      "content": "What's a model?"
    },
    {
      "role": "assistant",
      "content": "A model is a concept in Hasura that represents a data source in your project. It serves as a link between your data source (such as a database table) and the API generated by Hasura. \n\nA model is defined using an OpenDD object with specific fields such as name, dataType, source, and graphql. \n\nThe `name` field is the name of the model, the `dataType` field specifies the type of the model (e.g., author, book), the `source` field defines the data source for the model, and the `graphql` field specifies the GraphQL configuration for the model.\n\nModels can be backed by various data sources including database tables, ad-hoc SQL queries, pre-materialized views, or custom REST or GraphQL APIs. Once a model is declared, it can be referenced by relationships and permissions objects.\n\nModels allow you to organize and structure your data in Hasura, making it easier to work with and query your data in the GraphQL API."
    }
  ]
}
```

### Repeat with less "context" in each query to gauge efficacy

In the previous example,w e used `What's required for me to use one?` as the next query. We didn't mention the word
`model`. Again, we'll force GPT to use context from previous messages to see how well it can do. It's also been given a
directive in its prompt to not hallucinate or make up information...sometimes this works well. As an example, here's our
next query (including all previous messages):

```json
{
  "table": "pages",
  "columns": "body, keyword, title, path",
  "query": "Is there a limit to how many I can have?",
  "messages": [
    {
      "role": "user",
      "content": "What's a model?"
    },
    {
      "role": "assistant",
      "content": "A model is a concept in Hasura that represents a data source in your project. It serves as a link between your data source (such as a database table) and the API generated by Hasura. \n\nA model is defined using an OpenDD object with specific fields such as name, dataType, source, and graphql. \n\nThe `name` field is the name of the model, the `dataType` field specifies the type of the model (e.g., author, book), the `source` field defines the data source for the model, and the `graphql` field specifies the GraphQL configuration for the model.\n\nModels can be backed by various data sources including database tables, ad-hoc SQL queries, pre-materialized views, or custom REST or GraphQL APIs. Once a model is declared, it can be referenced by relationships and permissions objects.\n\nModels allow you to organize and structure your data in Hasura, making it easier to work with and query your data in the GraphQL API."
    },
    {
      "role": "user",
      "content": "What's required for me to use one?"
    },
    {
      "role": "assistant",
      "content": "To use a model in Hasura, you need the following:\n\n1. **Data Source**: You need to have a data source connected to your Hasura project. This can be a PostgreSQL database, a REST API, a custom GraphQL API, or other supported data sources.\n\n2. **Metadata File**: In Hasura, you need to create a metadata file that describes the structure and configuration of your project. This metadata file can be in YAML or JSON format and should include the definition of the model.\n\n3. **Model Configuration**: In the metadata file, you need to define the model by specifying its `name`, `dataType`, `source`, and `graphql` fields. The `name` field is the name of the model, the `dataType` field specifies the type of the model, the `source` field defines the data source for the model, and the `graphql` field specifies the GraphQL configuration for the model.\n\n4. **Data Source Configuration**: You need to configure the data source in Hasura to connect to your actual data source. This involves providing the necessary connection details such as the database connection string, REST endpoint URL, or GraphQL endpoint URL.\n\nOnce you have these requirements in place, you can start using models in Hasura to query and manipulate your data using the generated GraphQL API. You can define relationships between models, apply permissions, and perform various data operations using the GraphQL API."
    }
  ]
}
```

With an example "final" response of:

```json
{
  "role": "assistant",
  "content": "In Hasura, there is no hard limit on the number of models you can have. You can define as many models as you need to represent the data structure of your project.\n\nHowever, it's important to consider the performance and maintainability implications of having a large number of models. Each model comes with its own set of database tables or data source connections, and managing a large number of models can make your project more complex.\n\nIt is recommended to organize your models in a logical and manageable way, considering factors such as data relationships, data access patterns, and data source connections. This will help you maintain a clear and structured data model in your project.\n\nIf you are using a PostgreSQL database, it's worth noting that PostgreSQL itself imposes certain limitations on the number of tables, columns, and other database objects you can have. These limits vary depending on the PostgreSQL version and configuration.\n\nIn summary, while there is no specific limit on the number of models in Hasura, it is advisable to consider the practicality, performance, and maintainability aspects when designing your data model."
}
```
