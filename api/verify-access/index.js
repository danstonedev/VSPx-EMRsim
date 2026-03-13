const crypto = require('crypto');

function timeSafeCompare(a, b) {
  const aBuf = Buffer.from(a.trim());
  const bBuf = Buffer.from(b.trim());
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async function (context, req) {
  const code = req.body && req.body.code;
  const studentCode = process.env.ACCESS_CODE;
  const facultyCode = process.env.FACULTY_CODE;

  // No codes configured — allow everyone through as faculty
  if (!studentCode && !facultyCode) {
    context.res = { status: 200, body: { valid: true, role: 'faculty' } };
    return;
  }

  if (!code || typeof code !== 'string') {
    context.res = { status: 400, body: { valid: false, error: 'Code is required' } };
    return;
  }

  // Check faculty code first (higher privilege)
  if (facultyCode && timeSafeCompare(code, facultyCode)) {
    context.res = { status: 200, body: { valid: true, role: 'faculty' } };
    return;
  }

  // Check student code
  if (studentCode && timeSafeCompare(code, studentCode)) {
    context.res = { status: 200, body: { valid: true, role: 'student' } };
    return;
  }

  context.res = { status: 401, body: { valid: false, error: 'Invalid access code' } };
};
