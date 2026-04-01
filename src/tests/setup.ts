import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// Polyfill Element.animate for jsdom (Web Animations API not implemented)
if (typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = function () {
    return {
      finished: Promise.resolve(),
      cancel: () => {},
      onfinish: null,
    } as unknown as Animation;
  };
}
