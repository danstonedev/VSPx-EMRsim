const crypto = require('crypto');

module.exports = async function (context, req) {
  const code = req.body && req.body.code;
  const expected = process.env.ACCESS_CODE;

  if (!expected) {
    // No access code configured — allow everyone through
    context.res = { status: 200, body: { valid: true } };
    return;
  }

  if (!code || typeof code !== 'string') {
    context.res = { status: 400, body: { valid: false, error: 'Code is required' } };
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const codeBuffer = Buffer.from(code.trim());
  const expectedBuffer = Buffer.from(expected.trim());

  const valid =
    codeBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(codeBuffer, expectedBuffer);

  if (valid) {
    context.res = { status: 200, body: { valid: true } };
  } else {
    context.res = { status: 401, body: { valid: false, error: 'Invalid access code' } };
  }
};
