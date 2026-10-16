# Information & Exploration

**Status:** SPEC

Owns what each faction can see.

## Prototype Rules

- A faction has complete, current information about every system containing one of its fleets.
- A fleet on a Route counts as being at both star systems that Route links.
- It also has complete, current information about every system connected to those systems by a Route.
- A faction always knows its own territory.
- Visible information includes planets, ownership, garrisons, and fleets.
- A fleet on a Route is visible to every faction that has information about either star system that Route links.
- A faction always sees the buildings on its own planets.
- Buildings on foreign and neutral planets are hidden in the prototype.
- Information does not become stale in the prototype.
- AI receives exactly the same information available to its faction and cannot read hidden authoritative state.

## Later

The full game is intended to distinguish discovered static information from current intelligence and allow fleet positions, ownership, and other dynamic information to become stale.
