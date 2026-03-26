const { getPatientsContainer } = require('../shared/cosmos');
const { requireAuthenticatedPrincipal } = require('../shared/auth');

const MAX_PATIENTS = 200;

module.exports = async function (context, req) {
  try {
    const principal = requireAuthenticatedPrincipal(context, req);
    if (!principal) return;

    const container = getPatientsContainer();

    const querySpec = {
      query: 'SELECT * FROM c OFFSET 0 LIMIT @limit',
      parameters: [{ name: '@limit', value: MAX_PATIENTS }],
    };

    const { resources: patients } = await container.items.query(querySpec).fetchAll();

    // Return as map keyed by id to match frontend vsp_registry store shape
    const patientsMap = patients.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    context.res = {
      status: 200,
      body: patientsMap,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    context.log.error('Error fetching patients:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to fetch patients', details: error.message },
    };
  }
};
