const { getContainer } = require('../shared/cosmos');

module.exports = async function (context, req) {
  context.log('cases-delete function triggered');

  const caseId = req.query.id || (req.body && req.body.id);

  if (!caseId) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing case ID' }),
    };
    return;
  }

  try {
    const container = getContainer();

    // First, we need to find the item to get its partition key
    // Query for the item by id
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: caseId }],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      // Item doesn't exist in cloud - that's okay, return success
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Case not found in cloud (already deleted or never synced)',
        }),
      };
      return;
    }

    const item = resources[0];
    const partitionKey = item.category || 'uncategorized';

    // Delete the item
    await container.item(caseId, partitionKey).delete();

    context.log(`Deleted case ${caseId} from Cosmos DB`);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, deleted: caseId }),
    };
  } catch (err) {
    context.log.error('Delete error:', err.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
