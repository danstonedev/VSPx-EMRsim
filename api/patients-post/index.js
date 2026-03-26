const { getPatientsContainer } = require('../shared/cosmos');
const { requireAuthenticatedPrincipal, stampAuditFields } = require('../shared/auth');

module.exports = async function (context, req) {
  try {
    const principal = requireAuthenticatedPrincipal(context, req);
    if (!principal) return;

    const patient = req.body;

    if (!patient || !patient.id) {
      context.res = {
        status: 400,
        body: { error: 'Invalid patient data: missing id' },
      };
      return;
    }

    // Basic validation: require firstName and lastName
    if (!patient.firstName || !patient.lastName) {
      context.res = {
        status: 400,
        body: { error: 'firstName and lastName are required' },
      };
      return;
    }

    const container = getPatientsContainer();
    stampAuditFields(patient, principal);

    const { resource: saved } = await container.items.upsert(patient);

    context.res = {
      status: 200,
      body: saved,
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    context.log.error('Error saving patient:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to save patient', details: error.message },
    };
  }
};
