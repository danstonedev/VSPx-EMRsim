const { getContainer } = require('../shared/cosmos.js');

module.exports = async function (context, req) {
  try {
    const container = await getContainer();

    // Query all cases
    const querySpec = {
      query: 'SELECT * FROM c',
    };

    const { resources: cases } = await container.items.query(querySpec).fetchAll();

    // Transform array to map keyed by ID to match frontend store structure
    const casesMap = cases.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});

    context.res = {
      status: 200,
      body: casesMap,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.log.error('Error fetching cases:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to fetch cases', details: error.message },
    };
  }
};
