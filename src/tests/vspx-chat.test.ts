/**
 * Tests for VSPx chat widget — access service + eligibility logic + geometry.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isFacultyAuthoredCase,
  isVspxEnabledForCase,
  checkEligibility,
  resolveVspxUrl,
  normalizeUrl,
  hasVerifiedAccessCode,
  setVerifiedAccessCode,
  loadGeometry,
  saveGeometry,
  DEFAULT_GEO,
  VSPX_DEFAULTS,
  type CaseWrapperLike,
} from '$lib/services/vspxAccess';

// ─── Helpers ───

function makeWrapper(overrides: Partial<CaseWrapperLike> = {}): CaseWrapperLike {
  return {
    id: 'case-1',
    caseObj: {
      meta: {
        vspxFacultyCase: true,
        vspxEnabled: true,
      },
    },
    ...overrides,
  };
}

// ─── Eligibility ───

describe('isFacultyAuthoredCase', () => {
  it('returns true when meta.vspxFacultyCase is true', () => {
    const wrapper = makeWrapper();
    expect(isFacultyAuthoredCase(wrapper)).toBe(true);
  });

  it('returns true when wrapper.isFacultyCase is true', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: {} },
      isFacultyCase: true,
    });
    expect(isFacultyAuthoredCase(wrapper)).toBe(true);
  });

  it('returns true when wrapper.createdBy is set', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: {} },
      createdBy: 'faculty-user',
    });
    expect(isFacultyAuthoredCase(wrapper)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isFacultyAuthoredCase(null)).toBe(false);
  });

  it('returns false when no faculty indicators', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: {} },
      isFacultyCase: undefined,
      createdBy: undefined,
      createdByName: undefined,
    });
    expect(isFacultyAuthoredCase(wrapper)).toBe(false);
  });
});

describe('isVspxEnabledForCase', () => {
  it('returns true when meta.vspxEnabled is true', () => {
    expect(isVspxEnabledForCase(makeWrapper())).toBe(true);
  });

  it('returns false when meta.vspxEnabled is false', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: { vspxEnabled: false } },
    });
    expect(isVspxEnabledForCase(wrapper)).toBe(false);
  });

  it('returns false when no meta', () => {
    const wrapper = makeWrapper({ caseObj: {} });
    expect(isVspxEnabledForCase(wrapper)).toBe(false);
  });

  it('returns false for null wrapper', () => {
    expect(isVspxEnabledForCase(null)).toBe(false);
  });
});

describe('checkEligibility', () => {
  it('returns canUseVspx true for enabled faculty case', () => {
    const result = checkEligibility(makeWrapper());
    expect(result.canUseVspx).toBe(true);
    expect(result.isFacultyCase).toBe(true);
  });

  it('returns canUseVspx false when not faculty', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: { vspxEnabled: true } },
      isFacultyCase: undefined,
      createdBy: undefined,
    });
    const result = checkEligibility(wrapper);
    expect(result.canUseVspx).toBe(false);
  });

  it('returns canUseVspx false when not enabled', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: { vspxFacultyCase: true, vspxEnabled: false } },
    });
    expect(checkEligibility(wrapper).canUseVspx).toBe(false);
  });

  it('returns default URL when no custom URL set', () => {
    const result = checkEligibility(makeWrapper());
    expect(result.vspxUrl).toBe(VSPX_DEFAULTS.url);
  });

  it('returns custom URL when set in meta', () => {
    const wrapper = makeWrapper({
      caseObj: {
        meta: {
          vspxFacultyCase: true,
          vspxEnabled: true,
          vspxUrl: 'https://custom.example.com/',
        },
      },
    });
    const result = checkEligibility(wrapper);
    expect(result.vspxUrl).toBe('https://custom.example.com/');
  });
});

// ─── URL Normalization ───

describe('normalizeUrl', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
  });

  it('prefixes https:// when missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('preserves existing https://', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('preserves existing http://', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });
});

describe('resolveVspxUrl', () => {
  it('returns default URL for null wrapper', () => {
    expect(resolveVspxUrl(null)).toBe(VSPX_DEFAULTS.url);
  });

  it('returns configured URL when set', () => {
    const wrapper = makeWrapper({
      caseObj: { meta: { vspxUrl: 'https://custom.example.com' } },
    });
    expect(resolveVspxUrl(wrapper)).toBe('https://custom.example.com');
  });
});

// ─── Access Code Cache ───

describe('access code cache', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns false when no code is cached', () => {
    expect(hasVerifiedAccessCode('case-1')).toBe(false);
  });

  it('returns true after setting verified', () => {
    setVerifiedAccessCode('case-1', true);
    expect(hasVerifiedAccessCode('case-1')).toBe(true);
  });

  it('returns false after clearing', () => {
    setVerifiedAccessCode('case-1', true);
    setVerifiedAccessCode('case-1', false);
    expect(hasVerifiedAccessCode('case-1')).toBe(false);
  });

  it('caches per case ID', () => {
    setVerifiedAccessCode('case-1', true);
    expect(hasVerifiedAccessCode('case-1')).toBe(true);
    expect(hasVerifiedAccessCode('case-2')).toBe(false);
  });

  it('returns false for empty caseId', () => {
    expect(hasVerifiedAccessCode('')).toBe(false);
  });
});

// ─── Geometry Persistence ───

describe('geometry persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns default geometry when nothing saved', () => {
    const geo = loadGeometry();
    expect(geo).toEqual(DEFAULT_GEO);
  });

  it('saves and restores geometry', () => {
    const custom = { x: 100, y: 200, w: 500, h: 600, positioned: true };
    saveGeometry(custom);
    const loaded = loadGeometry();
    expect(loaded).toEqual(custom);
  });

  it('returns default if sessionStorage has corrupt data', () => {
    sessionStorage.setItem('vspx_chat_geometry', '{bad json');
    const geo = loadGeometry();
    expect(geo).toEqual(DEFAULT_GEO);
  });

  it('merges partial saved data with defaults', () => {
    sessionStorage.setItem('vspx_chat_geometry', JSON.stringify({ x: 50, y: 75 }));
    const geo = loadGeometry();
    expect(geo.x).toBe(50);
    expect(geo.y).toBe(75);
    expect(geo.w).toBe(DEFAULT_GEO.w);
    expect(geo.h).toBe(DEFAULT_GEO.h);
  });
});

// ─── Constants ───

describe('VSPX_DEFAULTS', () => {
  it('exposes expected dimension constants', () => {
    expect(VSPX_DEFAULTS.minW).toBe(320);
    expect(VSPX_DEFAULTS.minH).toBe(400);
    expect(VSPX_DEFAULTS.defaultW).toBe(400);
    expect(VSPX_DEFAULTS.defaultH).toBe(560);
    expect(VSPX_DEFAULTS.edgePad).toBe(48);
  });

  it('exposes iframe load timeout', () => {
    expect(VSPX_DEFAULTS.iframeLoadTimeout).toBe(8000);
  });
});
