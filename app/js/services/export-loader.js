// export-loader.js - On-demand loader for docx and FileSaver

const DOCX_URL = 'https://unpkg.com/docx@6.0.3/build/index.js';
const FILESAVER_URL = 'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js';

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(s);
  });
}

export async function ensureExportLibsLoaded() {
  if (typeof window !== 'undefined' && typeof window.docx === 'undefined') {
    const url = window.__DOCX_URL_OVERRIDE || DOCX_URL;
    await loadScript(url);
  }
  // Best-effort load of FileSaver for broader browser support
  if (typeof window !== 'undefined' && typeof window.saveAs === 'undefined') {
    const fsUrl = window.__FILESAVER_URL_OVERRIDE || FILESAVER_URL;
    try {
      await loadScript(fsUrl);
    } catch {
      /* safe fallback */
    }
  }
}

export default { ensureExportLibsLoaded };
