const { CosmosClient } = require('@azure/cosmos');

// Environment variables (set these in Azure Portal)
const CONNECTION_STRING = process.env.AZURE_COSMOS_CONNECTION_STRING;
const DATABASE_ID = 'emr-db';
const CONTAINER_ID = 'cases';

let client = null;
let container = null;

async function getContainer() {
  if (container) return container;

  if (!CONNECTION_STRING) {
    throw new Error('AZURE_COSMOS_CONNECTION_STRING is not defined');
  }

  if (!client) {
    client = new CosmosClient(CONNECTION_STRING);
  }

  const database = client.database(DATABASE_ID);
  container = database.container(CONTAINER_ID);
  return container;
}

module.exports = { getContainer };
