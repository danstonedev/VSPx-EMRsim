const { getUsersContainer } = require('../shared/cosmos');

/**
 * Admin API for user management
 * GET /api/admin/users - List all users (or filter by pending requests)
 * POST /api/admin/users - Approve/deny role requests or set roles
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

  // Check if user is admin
  const userRoles = authUser.userRoles || [];
  if (!userRoles.includes('admin')) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Admin access required' }),
    };
    return;
  }

  const adminUserId = authUser.userId;
  const adminEmail = authUser.userDetails || '';

  try {
    const container = getUsersContainer();

    if (req.method === 'GET') {
      // List users
      const filter = req.query.filter; // 'pending' for pending requests only
      let querySpec;

      if (filter === 'pending') {
        querySpec = {
          query: 'SELECT * FROM c WHERE c.roleRequestedAt != null AND c.role = @role',
          parameters: [{ name: '@role', value: 'student' }],
        };
      } else {
        querySpec = { query: 'SELECT * FROM c' };
      }

      const { resources } = await container.items.query(querySpec).fetchAll();

      // Sanitize output (don't expose internal fields)
      const users = resources.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        roleRequestedAt: u.roleRequestedAt,
        roleApprovedAt: u.roleApprovedAt,
        roleApprovedBy: u.roleApprovedBy,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));

      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, count: users.length }),
      };
    } else if (req.method === 'POST') {
      const body = req.body || {};
      const targetUserId = body.userId;
      const action = body.action; // 'approve', 'deny', 'set-role'
      const newRole = body.role; // for 'set-role' action

      if (!targetUserId) {
        context.res = {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing userId' }),
        };
        return;
      }

      // Get target user
      let user;
      try {
        const { resource } = await container.item(targetUserId, targetUserId).read();
        user = resource;
      } catch (e) {
        context.res = {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User not found' }),
        };
        return;
      }

      if (action === 'approve') {
        // Approve faculty request
        user.role = 'faculty';
        user.roleApprovedAt = new Date().toISOString();
        user.roleApprovedBy = adminEmail;
        user.roleRequestedAt = null; // Clear the request
        await container.item(targetUserId, targetUserId).replace(user);
        context.log(`Faculty access approved for ${user.email} by ${adminEmail}`);

        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Faculty access approved', user: user.email }),
        };
      } else if (action === 'deny') {
        // Deny faculty request
        user.roleRequestedAt = null; // Clear the request
        await container.item(targetUserId, targetUserId).replace(user);
        context.log(`Faculty request denied for ${user.email} by ${adminEmail}`);

        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Faculty request denied', user: user.email }),
        };
      } else if (action === 'set-role') {
        // Directly set role (admin only)
        if (!['student', 'faculty', 'admin'].includes(newRole)) {
          context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid role' }),
          };
          return;
        }

        user.role = newRole;
        user.roleApprovedAt = new Date().toISOString();
        user.roleApprovedBy = adminEmail;
        user.roleRequestedAt = null;
        await container.item(targetUserId, targetUserId).replace(user);
        context.log(`Role set to ${newRole} for ${user.email} by ${adminEmail}`);

        context.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Role set to ${newRole}`, user: user.email }),
        };
      } else {
        context.res = {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid action' }),
        };
      }
    }
  } catch (err) {
    context.log.error('Admin API error:', err.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
