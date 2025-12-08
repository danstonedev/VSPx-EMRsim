const { getUsersContainer } = require('../shared/cosmos');

/**
 * GET /api/user - Get current user profile (auto-registers on first visit)
 * POST /api/user - Update user profile or request role upgrade
 */
module.exports = async function (context, req) {
  // Get authenticated user from Azure SWA headers
  const clientPrincipal = req.headers['x-ms-client-principal'];

  if (!clientPrincipal) {
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not authenticated' }),
    };
    return;
  }

  let authUser;
  try {
    authUser = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString('utf8'));
  } catch (e) {
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid authentication token' }),
    };
    return;
  }

  const userId = authUser.userId;
  const email = authUser.userDetails || '';
  const displayName =
    authUser.claims?.find((c) => c.typ === 'name')?.val || email.split('@')[0] || 'User';

  try {
    const container = getUsersContainer();

    if (req.method === 'GET') {
      // Try to get existing user
      let user = null;
      try {
        const { resource } = await container.item(userId, userId).read();
        user = resource;
      } catch (e) {
        if (e.code !== 404) throw e;
      }

      if (!user) {
        // Auto-register new user as student
        user = {
          id: userId,
          odataPartitionKey: userId, // Partition key
          email: email,
          displayName: displayName,
          role: 'student', // Default role
          roleRequestedAt: null,
          roleApprovedAt: null,
          roleApprovedBy: null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await container.items.create(user);
        context.log(`Created new user: ${email} (${userId})`);
      } else {
        // Update last login time
        user.lastLoginAt = new Date().toISOString();
        await container.item(userId, userId).replace(user);
      }

      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          roleRequestedAt: user.roleRequestedAt,
          createdAt: user.createdAt,
        }),
      };
    } else if (req.method === 'POST') {
      // Get existing user
      let user;
      try {
        const { resource } = await container.item(userId, userId).read();
        user = resource;
      } catch (e) {
        context.res = {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User not found' }),
        };
        return;
      }

      const body = req.body || {};

      // Handle role upgrade request
      if (body.action === 'request-faculty') {
        if (user.role === 'faculty' || user.role === 'admin') {
          context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'You already have faculty or higher access' }),
          };
          return;
        }

        user.roleRequestedAt = new Date().toISOString();
        await container.item(userId, userId).replace(user);
        context.log(`Faculty access requested by: ${email}`);

        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Faculty access requested. An administrator will review your request.',
            roleRequestedAt: user.roleRequestedAt,
          }),
        };
        return;
      }

      // Handle display name update
      if (body.displayName) {
        user.displayName = body.displayName.slice(0, 100); // Limit length
        await container.item(userId, userId).replace(user);

        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Profile updated', displayName: user.displayName }),
        };
        return;
      }

      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid request' }),
      };
    }
  } catch (err) {
    context.log.error('User API error:', err.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
