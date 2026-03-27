/**
 * Manifest loader — fetches case data from static/data/cases/manifest.json
 * Ported from the manifest helpers in app/js/core/store.js
 */

export interface ManifestCase {
  id: string;
  name: string;
  file: string;
  category?: string;
}

export interface ManifestCategory {
  id: string;
  name: string;
  cases: ManifestCase[];
}

export interface Manifest {
  categories: ManifestCategory[];
}

let cached: Manifest | null = null;

export async function getManifest(): Promise<Manifest | null> {
  if (cached) return cached;
  try {
    const res = await fetch('/data/cases/manifest.json', { cache: 'no-store' });
    if (!res.ok) return null;
    cached = (await res.json()) as Manifest;
    return cached;
  } catch {
    return null;
  }
}

export function flattenManifestCases(manifest: Manifest): ManifestCase[] {
  const out: ManifestCase[] = [];
  for (const cat of manifest.categories) {
    for (const c of cat.cases) {
      if (c?.id) out.push({ ...c, category: cat.id });
    }
  }
  return out;
}
