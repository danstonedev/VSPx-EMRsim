import { getContainer } from '../shared/cosmos.js';
// We import the schema validation from the frontend code
// Note: We need to use a relative path that goes up to the app folder
import { validateCase, ensureDataIntegrity } from '../../app/js/core/schema.js';

export default async function (context, req) {
  try {
    const caseData = req.body;

    if (!caseData || !caseData.id) {
      context.res = {
        status: 400,
        body: { error: 'Invalid case data: missing ID' },
      };
      return;
    }

    // 1. Validate the case using the shared schema logic
    // We wrap this in a try-catch because validateCase might throw or return errors
    try {
      // Ensure structure is correct
      const cleanCase = ensureDataIntegrity(caseData);

      // Run validation rules
      const validationErrors = validateCase(cleanCase);
      if (validationErrors.length > 0) {
        context.res = {
          status: 400,
          body: { error: 'Validation failed', details: validationErrors },
        };
        return;
      }
    } catch (validationError) {
      context.res = {
        status: 400,
        body: { error: 'Schema validation error', details: validationError.message },
      };
      return;
    }

    // 2. Save to Cosmos DB
    const container = await getContainer();

    // Upsert (create or replace)
    const { resource: savedItem } = await container.items.upsert(caseData);

    context.res = {
      status: 200,
      body: savedItem,
    };
  } catch (error) {
    context.log.error('Error saving case:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to save case' },
    };
  }
}
