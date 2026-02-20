/**
 * Simple bundle size budget checker for dist/assets.
 * Fails with non-zero exit if any monitored chunk exceeds its byte budget.
 *
 * Usage: node scripts/check-bundle-sizes.mjs
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist', 'assets');

// Allow a small slack margin for transient churn.
// Default 3% unless overridden via env BUNDLE_SIZE_SLACK_PCT (e.g., 5 for 5%).
const slackPct = Math.max(0, Number(process.env.BUNDLE_SIZE_SLACK_PCT || '3')) / 100;

// Budgets in bytes (modern bundles only; ignoring -legacy- chunks)
// Set conservatively above current snapshot to allow minor churn without regressions.
const budgets = {
  // Set slightly above recent measurements to avoid false positives but still catch regressions
  ChartNavigation: 56000,
  'artifacts-panel': 11500,
  'sign-export-panel': 3000,
  SignatureModal: 7000,
  'document-export': 42000,
  'mount-panel': 1200,
  prefetch: 1200,
  async: 1200,
  // Monitor editor view shell as a coarse guard (chunk name inferred from entry)
  case_editor: 120000,
};

/**
 * Resolve the newest non-legacy, non-map JS file matching a baseName pattern.
 */
function findModernAsset(baseName) {
  const files = readdirSync(distDir).filter(
    (f) => f.startsWith(baseName + '-') && f.endsWith('.js') && !f.includes('-legacy-'),
  );
  if (files.length === 0) return null;
  // Pick the most recently modified to be safe
  const withTimes = files.map((f) => ({ f, mtime: statSync(join(distDir, f)).mtimeMs }));
  withTimes.sort((a, b) => b.mtime - a.mtime);
  return withTimes[0].f;
}

let failed = false;
const results = [];

for (const [name, limitBase] of Object.entries(budgets)) {
  const file = findModernAsset(name);
  if (!file) {
    // Missing monitored asset isn't a hard failure, but surface as a warning.
    results.push({ name, file: '(missing)', size: 0, limit: limitBase, status: 'warn' });
    continue;
  }
  const size = statSync(join(distDir, file)).size;
  const limit = Math.floor(limitBase * (1 + slackPct));
  const status = size <= limit ? 'ok' : 'fail';
  if (status === 'fail') failed = true;
  results.push({ name, file, size, limit, status });
}

// Pretty print summary
const pad = (s, n) => (s + '').padEnd(n);
console.log('\nBundle size budget check (bytes):');
console.log(pad('Chunk', 22), pad('File', 40), pad('Size', 10), pad('Limit', 10), 'Status');
for (const r of results) {
  console.log(
    pad(r.name, 22),
    pad(r.file, 40),
    pad(r.size, 10),
    pad(r.limit, 10),
    r.status.toUpperCase(),
  );
}
console.log('');

if (failed) {
  console.error('Bundle size budget check FAILED: at least one chunk exceeds its limit.');
  process.exit(2);
} else {
  console.log('Bundle size budget check PASSED.');
}
