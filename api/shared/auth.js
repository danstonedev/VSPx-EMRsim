function isDevelopmentEnvironment() {
  return (
    process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development' ||
    process.env.NODE_ENV === 'development'
  );
}

function decodeClientPrincipal(req) {
  const encoded = req.headers['x-ms-client-principal'];
  if (!encoded) return null;

  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function requireAuthenticatedPrincipal(context, req) {
  const principal = decodeClientPrincipal(req);
  if (principal?.userId) {
    return principal;
  }

  if (isDevelopmentEnvironment()) {
    return {
      userId: 'local-dev-user',
      userDetails: 'local-dev-user@example.test',
      userRoles: ['authenticated', 'faculty', 'admin'],
      isLocalDevelopment: true,
    };
  }

  context.res = {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
    body: { error: 'Authentication required' },
  };
  return null;
}

/**
 * Stamp server-authoritative audit fields on a document before upsert.
 * - updatedBy/updatedAt always come from the principal (never trust client).
 * - createdBy/createdAt are only set when the document has no existing value.
 */
function stampAuditFields(doc, principal) {
  const now = new Date().toISOString();
  const userId = principal.userId;
  const userName = principal.userDetails || userId;

  // Always overwrite update fields from server principal
  doc.updatedBy = userId;
  doc.updatedByName = userName;
  doc.updatedAt = now;

  // Only stamp creation fields when absent (first write)
  if (!doc.createdBy) {
    doc.createdBy = userId;
    doc.createdByName = userName;
    doc.createdAt = now;
  }
}

module.exports = {
  decodeClientPrincipal,
  requireAuthenticatedPrincipal,
  stampAuditFields,
};
