import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const buildDir = resolve(import.meta.dirname, '../../build');

describe('production build', () => {
  it('outputs build/index.html', () => {
    expect(existsSync(resolve(buildDir, 'index.html'))).toBe(true);
  });

  it('outputs static assets', () => {
    expect(existsSync(resolve(buildDir, 'img'))).toBe(true);
    expect(existsSync(resolve(buildDir, 'data'))).toBe(true);
  });

  it('outputs workspace route', () => {
    expect(existsSync(resolve(buildDir, 'workspace.html'))).toBe(true);
  });

  it('outputs legal route', () => {
    expect(existsSync(resolve(buildDir, 'legal.html'))).toBe(true);
  });

  it('outputs 404 page', () => {
    expect(existsSync(resolve(buildDir, '404.html'))).toBe(true);
  });

  it('outputs _app directory with JS bundles', () => {
    expect(existsSync(resolve(buildDir, '_app'))).toBe(true);
  });
});
