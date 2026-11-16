import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';

afterEach(() => vi.unstubAllEnvs());

describe('public asset URLs', () => {
  it('keeps local development assets at the root', () => {
    vi.stubEnv('BASE_URL', '/');
    expect(getPublicAssetUrl('portraits/avar.webp')).toBe(
      '/portraits/avar.webp',
    );
  });

  it('resolves game assets inside a GitHub Pages project', () => {
    vi.stubEnv('BASE_URL', '/kunstkamera/gemstorm/game/');
    expect(getPublicAssetUrl('portraits/avar.webp')).toBe(
      '/kunstkamera/gemstorm/game/portraits/avar.webp',
    );
    expect(getPublicAssetUrl('sounds/march.ogg')).toBe(
      '/kunstkamera/gemstorm/game/sounds/march.ogg',
    );
  });
});
