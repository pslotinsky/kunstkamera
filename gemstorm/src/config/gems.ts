import type { GemParams } from '@/core/domain/Gem';

export const GEMS: readonly GemParams[] = [
  {
    gemstone: 'Ruby',
    guardian: {
      name: 'Ashwing',
      attack: 30,
      defense: 30,
      description: 'Breathes fire from the sky',
      strength: 160,
      move: 2,
      range: 'largest',
    },
  },
  {
    gemstone: 'Sapphire',
    guardian: {
      name: 'Asterion',
      attack: 29,
      defense: 29,
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
      attack: 28,
      defense: 28,
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
      attack: 25,
      defense: 25,
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
      attack: 24,
      defense: 24,
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
      attack: 22,
      defense: 23,
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
      attack: 22,
      defense: 22,
      description: 'Breathes a poison cloud',
      strength: 110,
      move: 3,
      range: 'circular',
    },
  },
];
