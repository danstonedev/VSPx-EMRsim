/**
 * Vite plugin — local dev proxy for /api/patients → Cosmos DB.
 *
 * During `vite dev` this adds Express-style middleware so the frontend
 * can hit /api/patients without needing Azure Functions Core Tools or
 * a deployed SWA.  Reads AZURE_COSMOS_CONNECTION_STRING from env or .env.
 *
 * In production builds this file is never included.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Resolve @azure/cosmos from api/node_modules
const require = createRequire(new URL('../api/', import.meta.url));
const { CosmosClient } = require('@azure/cosmos');

const DATABASE_ID = 'emr-db';
const CONTAINER_ID = 'patients';

let container = null;

/** Load connection string from process.env or .env file */
function getConnectionString() {
  if (process.env.AZURE_COSMOS_CONNECTION_STRING) {
    return process.env.AZURE_COSMOS_CONNECTION_STRING;
  }
  // Fall back to reading .env file in project root
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^AZURE_COSMOS_CONNECTION_STRING=(.+)$/);
      if (match) return match[1].trim();
    }
  } catch {
    /* no .env file */
  }
  return null;
}

function getContainer() {
  if (container) return container;
  const cs = getConnectionString();
  if (!cs) return null;
  const client = new CosmosClient(cs);
  container = client.database(DATABASE_ID).container(CONTAINER_ID);
  return container;
}

/** @returns {import('vite').Plugin} */
export default function cosmosPatientProxy() {
  return {
    name: 'cosmos-patient-proxy',
    configureServer(server) {
      // GET /api/patients — return all patients as a map { [id]: record }
      server.middlewares.use('/api/patients', async (req, res, next) => {
        // Only handle our routes, pass anything else through
        if (req.method === 'GET') {
          const c = getContainer();
          if (!c) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'AZURE_COSMOS_CONNECTION_STRING not set' }));
            return;
          }
          try {
            const { resources } = await c.items
              .query({ query: 'SELECT * FROM c ORDER BY c.lastName' })
              .fetchAll();
            const map = {};
            for (const r of resources) map[r.id] = r;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(map));
          } catch (err) {
            console.error('[cosmos-proxy] GET error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (req.method === 'POST') {
          const c = getContainer();
          if (!c) {
            res.statusCode = 503;
            res.end('{}');
            return;
          }
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const patient = JSON.parse(body);
              if (!patient.id || !patient.firstName || !patient.lastName) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'id, firstName, lastName required' }));
                return;
              }
              const { resource } = await c.items.upsert(patient);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(resource));
            } catch (err) {
              console.error('[cosmos-proxy] POST error:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'DELETE') {
          const c = getContainer();
          if (!c) {
            res.statusCode = 503;
            res.end('{}');
            return;
          }
          const url = new URL(req.url, 'http://localhost');
          const id = url.searchParams.get('id');
          if (!id) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing patient id' }));
            return;
          }
          try {
            await c.item(id, id).delete();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            // 404 = already deleted, that's fine
            if (err.code === 404) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, message: 'already deleted' }));
            } else {
              console.error('[cosmos-proxy] DELETE error:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          }
          return;
        }

        next();
      });
    },
  };
}
