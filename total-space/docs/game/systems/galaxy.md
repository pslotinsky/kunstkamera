# Galaxy & Territory

**Status:** DRAFT

Owns the galaxy's structure: star systems, Routes, and territorial control.

## Rules

- The galaxy is a finite strategic space with a shared coordinate system.
- Star systems, planets, and fleets all have positions in that same galaxy space.
- A star system contains one or more planets.
- Every planet belongs to exactly one star system while retaining its own position in galaxy space.
- Planets can have different owners within the same system.
- System control is derived from planet ownership rather than stored as an unrelated ownership layer.
- A faction has full control of a star system when it owns every planet in it.
- Full system control increases income from that system's planets by 10%.
- Star systems are connected by Routes. A Route links exactly two star systems.
- Fleets travel only along Routes. Travel through open space away from Routes takes years, so the game does not offer it.
- Distance, spatial arrangement, borders, isolated territories, and fleet positions affect strategy.

## Prototype

- The first prototype uses a fixed, symmetric galaxy.
- The prototype contains four playable factions plus neutral factions that own the remaining planets.
- Procedural galaxy generation is deferred until the core loop is stable.

## Later

- Generated galaxies for normal play and automated simulation.

## Open Questions

- Exact prototype galaxy layout, size, and Route network.
