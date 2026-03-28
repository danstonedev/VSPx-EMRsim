/**
 * VSPx access verification service.
 * Port of access-checking logic from app/js/features/vspx-chat/vspx-chat.js.
 *
 * Handles faculty access code verification for VSPx chat, with sessionStorage
 * caching so users aren't prompted repeatedly per case.
 */

const ACCESS_CACHE_PREFIX = 'vspx_access_ok_';
const DEFAULT_VSPX_URL = 'https://gray-pond-069cfc21e.3.azurestaticapps.net/';

// ─── Types ───

export interface VspxEligibility {
  canUseVspx: boolean;
  isFacultyCase: boolean;
  vspxUrl: string;
}

export interface CaseMetaLike {
  vspxFacultyCase?: boolean;
  vspxEnabled?: boolean;
  vspxUrl?: string;
  [key: string]: unknown;
}

export interface CaseObjLike {
  meta?: CaseMetaLike;
  createdBy?: string;
  createdByName?: string;
  [key: string]: unknown;
}

export interface CaseWrapperLike {
  id: string;
  caseObj?: CaseObjLike;
  isFacultyCase?: boolean;
  createdBy?: string;
  createdByName?: string;
  [key: string]: unknown;
}

// ─── Eligibility ───

export function isFacultyAuthoredCase(wrapper: CaseWrapperLike | null): boolean {
  if (!wrapper || typeof wrapper !== 'object') return false;
  if (wrapper.caseObj?.meta?.vspxFacultyCase === true) return true;
  return wrapper.isFacultyCase === true || Boolean(wrapper.createdBy || wrapper.createdByName);
}

export function isVspxEnabledForCase(wrapper: CaseWrapperLike | null): boolean {
  return wrapper?.caseObj?.meta?.vspxEnabled === true;
}

export function resolveVspxUrl(wrapper: CaseWrapperLike | null): string {
  const configured = wrapper?.caseObj?.meta?.vspxUrl;
  const raw = typeof configured === 'string' ? configured.trim() : '';
  return normalizeUrl(raw) || DEFAULT_VSPX_URL;
}

export function checkEligibility(wrapper: CaseWrapperLike | null): VspxEligibility {
  const faculty = isFacultyAuthoredCase(wrapper);
  const enabled = isVspxEnabledForCase(wrapper);
  return {
    canUseVspx: faculty && enabled,
    isFacultyCase: faculty,
    vspxUrl: resolveVspxUrl(wrapper),
  };
}

// ─── URL Normalization ───

export function normalizeUrl(url: string): string {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

// ─── Access Code Cache ───

function getAccessCacheKey(caseId: string): string {
  return ACCESS_CACHE_PREFIX + caseId;
}

export function hasVerifiedAccessCode(caseId: string): boolean {
  if (!caseId) return false;
  try {
    return sessionStorage.getItem(getAccessCacheKey(caseId)) === '1';
  } catch {
    return false;
  }
}

export function setVerifiedAccessCode(caseId: string, verified: boolean): void {
  if (!caseId) return;
  try {
    if (verified) {
      sessionStorage.setItem(getAccessCacheKey(caseId), '1');
    } else {
      sessionStorage.removeItem(getAccessCacheKey(caseId));
    }
  } catch {
    /* storage unavailable */
  }
}

// ─── Geometry Persistence ───

const GEO_KEY = 'vspx_chat_geometry';

export interface VspxGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  positioned: boolean;
}

export const DEFAULT_GEO: VspxGeometry = {
  x: 0,
  y: 0,
  w: 400,
  h: 560,
  positioned: false,
};

export function loadGeometry(): VspxGeometry {
  try {
    const raw = sessionStorage.getItem(GEO_KEY);
    if (raw) return { ...DEFAULT_GEO, ...JSON.parse(raw) };
  } catch {
    /* corrupt */
  }
  return { ...DEFAULT_GEO };
}

export function saveGeometry(geo: VspxGeometry): void {
  try {
    sessionStorage.setItem(GEO_KEY, JSON.stringify(geo));
  } catch {
    /* quota */
  }
}

// ─── Access Verification ───

export async function verifyFacultyAccessCode(caseId: string): Promise<boolean> {
  // Pre-flight: check if the verification API is available
  let apiAvailable = false;
  try {
    const ping = await fetch('/api/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '' }),
    });
    const pingData: Record<string, unknown> | null = await ping.json().catch(() => null);
    if (!pingData) {
      // Response wasn't JSON — API proxy returned HTML error page
    } else if (ping.ok && pingData.valid && pingData.role === 'faculty') {
      // No codes configured — everyone is faculty
      setVerifiedAccessCode(caseId, true);
      return true;
    } else {
      // Got a proper JSON error — API is live and enforcing codes
      apiAvailable = true;
    }
  } catch {
    // Network error — API unreachable
  }

  if (!apiAvailable) {
    // Local dev or API offline — skip access gate
    setVerifiedAccessCode(caseId, true);
    return true;
  }

  // API is live and requires a code — prompt the user
  const code = window.prompt('Enter faculty access code to open VSPx call tools:');
  if (!code) return false;

  try {
    const res = await fetch('/api/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data: Record<string, unknown> = await res.json().catch(() => ({}));
    if (res.ok && data.valid && data.role === 'faculty') {
      setVerifiedAccessCode(caseId, true);
      return true;
    }
  } catch {
    // Network error on code submission — allow access (graceful degradation)
    setVerifiedAccessCode(caseId, true);
    return true;
  }

  alert('Invalid faculty access code.');
  return false;
}

// ─── Constants (exported for components) ───

export const VSPX_DEFAULTS = {
  url: DEFAULT_VSPX_URL,
  minW: 320,
  minH: 400,
  defaultW: 400,
  defaultH: 560,
  edgePad: 48,
  iframeLoadTimeout: 8000,
} as const;
