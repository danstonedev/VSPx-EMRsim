const { getPatientsContainer } = require('../shared/cosmos');

module.exports = async function (context, req) {
  const patientId = req.query.id || (req.body && req.body.id);

  if (!patientId) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing patient ID' }),
    };
    return;
  }

  // Decode SWA auth
  const clientPrincipal = req.headers['x-ms-client-principal'];
  let userRoles = [];
  if (clientPrincipal) {
    try {
      const decoded = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString('utf8'));
      userRoles = decoded.userRoles || [];
    } catch (e) {
      context.log.warn('Failed to decode client principal:', e);
    }
  }

  const isPrivileged = userRoles.includes('admin') || userRoles.includes('faculty');
  if (!isPrivileged) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Only faculty or admin may delete patients' }),
    };
    return;
  }

  try {
    const container = getPatientsContainer();

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: patientId }],
    };
    const { resources } = await container.items.query(querySpec).fetchAll();

    if (resources.length === 0) {
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, message: 'Patient not found (already deleted)' }),
      };
      return;
    }

    const item = resources[0];
    await container.item(item.id, item.id).delete();

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    context.log.error('Error deleting patient:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to delete patient', details: error.message },
    };
  }
};
