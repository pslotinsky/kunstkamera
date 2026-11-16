import type { GemParams } from '@/core/domain/Gem';

export const GEMS: readonly GemParams[] = [
  {
    gemstone: 'Ruby',
    guardian: {
      name: 'Ashwing',
      description: 'The ember-winged guardian of the high beacon',
      strength: 160,
      move: 2,
      range: 'largest',
    },
  },
  {
    gemstone: 'Sapphire',
    guardian: {
      name: 'Asterion',
      description: 'Rains stars and fireballs',
      strength: 160,
      move: 2,
      range: 'circular',
    },
  },
  {
    gemstone: 'Emerald',
    guardian: {
      name: 'Voltryn',
      description: 'Calls down lightning',
      strength: 150,
      move: 3,
      range: 'circular',
    },
  },
  {
    gemstone: 'Garnet',
    guardian: {
      name: 'Cindrath',
      description: 'Burns with blue fire',
      strength: 140,
      move: 2,
      range: 'short',
    },
  },
  {
    gemstone: 'Topaz',
    guardian: {
      name: 'Galestra',
      description: 'Rides the wind',
      strength: 130,
      move: 2,
      range: 'short',
    },
  },
  {
    gemstone: 'Amethyst',
    guardian: {
      name: 'Rimeveil',
      description: 'Freezes the field',
      strength: 120,
      move: 3,
      range: 'short',
    },
  },
  {
    gemstone: 'Opal',
    guardian: {
      name: 'Morgrin',
      description: 'Breathes a poison cloud',
      strength: 110,
      move: 3,
      range: 'circular',
    },
  },
];
