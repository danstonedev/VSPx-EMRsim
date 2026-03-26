const { CosmosClient } = require('@azure/cosmos');

// Environment variables (set these in Azure Portal)
const CONNECTION_STRING = process.env.AZURE_COSMOS_CONNECTION_STRING;
const DATABASE_ID = 'emr-db';
const CASES_CONTAINER_ID = 'cases';
const USERS_CONTAINER_ID = 'users';
const PATIENTS_CONTAINER_ID = 'patients';

let client = null;
let casesContainer = null;
let usersContainer = null;
let patientsContainer = null;

function getClient() {
  if (!CONNECTION_STRING) {
    throw new Error('AZURE_COSMOS_CONNECTION_STRING is not defined');
  }
  if (!client) {
    client = new CosmosClient(CONNECTION_STRING);
  }
  return client;
}

function getContainer() {
  if (casesContainer) return casesContainer;
  const database = getClient().database(DATABASE_ID);
  casesContainer = database.container(CASES_CONTAINER_ID);
  return casesContainer;
}

function getUsersContainer() {
  if (usersContainer) return usersContainer;
  const database = getClient().database(DATABASE_ID);
  usersContainer = database.container(USERS_CONTAINER_ID);
  return usersContainer;
}

function getPatientsContainer() {
  if (patientsContainer) return patientsContainer;
  const database = getClient().database(DATABASE_ID);
  patientsContainer = database.container(PATIENTS_CONTAINER_ID);
  return patientsContainer;
}

module.exports = { getContainer, getUsersContainer, getPatientsContainer };
