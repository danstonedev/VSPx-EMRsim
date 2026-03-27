import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const buildDir = resolve(import.meta.dirname, '../../build');

/**
 * Verify the built HTML shell contains expected meta/structure.
 * Content is rendered client-side (SPA mode), so we verify the
 * shell, scripts, and static assets are correctly wired.
 */
describe('SPA shell (build output)', () => {
  const html = readFileSync(resolve(buildDir, 'index.html'), 'utf-8');

  it('has correct meta tags', () => {
    expect(html).toContain('UND EMR-Sim');
    expect(html).toContain('name="description"');
    expect(html).toContain('viewport');
  });

  it('references favicon assets', () => {
    expect(html).toContain('EMRsim-flame.svg');
    expect(html).toContain('green-white-favicon');
  });

  it('includes SvelteKit JS bundles', () => {
    expect(html).toContain('_app/immutable/');
    expect(html).toContain('modulepreload');
  });

  it('has SvelteKit body target', () => {
    expect(html).toContain('data-sveltekit-preload-data');
    expect(html).toContain('display: contents');
  });

  it('outputs separate route HTML files', () => {
    const workspace = readFileSync(resolve(buildDir, 'workspace.html'), 'utf-8');
    const legal = readFileSync(resolve(buildDir, 'legal.html'), 'utf-8');
    // Both files exist and contain SvelteKit bootstrap
    expect(workspace).toContain('_app/immutable/');
    expect(legal).toContain('_app/immutable/');
  });
});
