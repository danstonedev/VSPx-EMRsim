// @ts-check
// mount-panel.js - standard mounting lifecycle for lazily loaded panels

import { safeAsync } from './async.js';

/**
 * Mount a panel given a dynamic importer and options.
 *
 * Panel contract: module exports `render(container, props)` returning `{ cleanup?: () => void }`.
 *
 * @param {HTMLElement} container
 * @param {() => Promise<{ render: (container: HTMLElement, props?: any) => { cleanup?: () => void } }>} loader
 * @param {any} [props]
 * @returns {{ dispose: () => void }}
 */
export function mountPanel(container, loader, props) {
  /** @type {null | (() => void)} */
  let cleanup = null;
  const doMount = safeAsync(async () => {
    const mod = await loader();
    if (!mod || typeof mod.render !== 'function') {
      throw new Error('Panel module missing render(container, props) export');
    }
    const result = mod.render(container, props);
    cleanup = (result && result.cleanup) || null;
  });
  doMount();

  return {
    dispose() {
      try {
        cleanup && cleanup();
      } catch (err) {
        console.warn('[MountPanel] cleanup error:', err);
      }
      cleanup = null;
    },
  };
}
