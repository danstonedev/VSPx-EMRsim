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

  // Get authenticated user from Azure SWA headers
  const clientPrincipal = req.headers['x-ms-client-principal'];
  let userId = null;
  let userRoles = [];

  if (clientPrincipal) {
    try {
      const decoded = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString('utf8'));
      userId = decoded.userId;
      userRoles = decoded.userRoles || [];
    } catch (e) {
      context.log.warn('Failed to decode client principal:', e);
    }
  }

  const isAdmin = userRoles.includes('admin');

  try {
    const container = getContainer();

    // First, we need to find the item to get its partition key and ownership
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

    // Check ownership: only owner or admin can delete
    if (item.createdBy && item.createdBy !== userId && !isAdmin) {
      context.res = {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Permission denied: You can only delete cases you created',
          owner: item.createdByName || 'another user',
        }),
      };
      return;
    }

    // Use the item's id as the partition key (matches Cosmos container config).
    // Fall back to category or id if the container uses a different partition scheme.
    const partitionKey = item.id || item.category || caseId;

    // Delete the item
    await container.item(caseId, partitionKey).delete();

    context.log(`Deleted case ${caseId} from Cosmos DB by user ${userId}`);

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
