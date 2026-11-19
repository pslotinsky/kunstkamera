import type { Advisor } from '@/core/domain/Advisor';

import { getPublicAssetUrl } from './getPublicAssetUrl';

export function getAdvisorPortraitUrl(advisor: Advisor): string {
  return getPublicAssetUrl(`advisors/${advisor.name.toLowerCase()}.webp`);
}
