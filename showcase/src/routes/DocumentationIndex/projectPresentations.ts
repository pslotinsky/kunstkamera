import gemfireFachan from '../../../../gemfire/public/unit/fachan.webp';
import fleetCarrier from '../../../../total-space/docs/game/content/ships/images/14-fleet-carrier.webp';
import type { ProjectId } from '../../projects';
import type { ProjectCardProps } from './ProjectCard';

export const projectPresentations = {
  gemfire: {
    label: 'Turn-based strategy',
    description:
      'Develop provinces, command armies, and fight for Ishmeria in a browser remake of Koei’s strategy game.',
    image: gemfireFachan,
    imageAlt: 'Gemfire fachan unit',
    imageFit: 'contain',
  },
  'total-space': {
    label: 'Space strategy',
    description:
      'Explore the game design and try interactive concepts for the campaign and fleet battles.',
    image: fleetCarrier,
    imageAlt: 'Total Space fleet carrier concept art',
    imageFit: 'contain',
  },
} satisfies Record<ProjectId, Omit<ProjectCardProps, 'name' | 'links'>>;
