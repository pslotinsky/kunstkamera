import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';

afterEach(() => vi.unstubAllEnvs());

describe('public asset URLs', () => {
  it('keeps local development assets at the root', () => {
    vi.stubEnv('BASE_URL', '/');
    expect(getPublicAssetUrl('portraits/erin.webp')).toBe(
      '/portraits/erin.webp',
    );
  });

  it('resolves game assets inside a GitHub Pages project', () => {
    vi.stubEnv('BASE_URL', '/kunstkamera/gemfire/game/');
    expect(getPublicAssetUrl('portraits/erin.webp')).toBe(
      '/kunstkamera/gemfire/game/portraits/erin.webp',
    );
    expect(getPublicAssetUrl('sounds/march.ogg')).toBe(
      '/kunstkamera/gemfire/game/sounds/march.ogg',
    );
  });
});
