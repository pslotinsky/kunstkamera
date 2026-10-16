# Fleet Movement

**Status:** DRAFT

Owns how fleets travel along Routes.

## Rules

- Every fleet is either at a star system or on a Route between two star systems.
- Fleets travel only along Routes, as defined in [galaxy.md](galaxy.md).
- A movement order follows a path of connected Routes toward a star system, or toward a known enemy fleet when the relevant action allows it.
- At the start of its faction's turn, a fleet receives movement reserve equal to its speed, as defined in [fleets.md](fleets.md).
- Travelling consumes movement reserve continuously according to distance travelled along the Route.
- A fleet can stop part-way along a Route when its movement reserve is exhausted and continue from that position on a later turn.
- Hostile fleets fight only when a faction orders an attack, at a star system or on a Route; see [fleet-combat.md](fleet-combat.md).
- Attacking costs a large share of the attacking fleet's remaining movement reserve. A fleet can attack more than once per turn if it still has the reserve to reach another target.

## Recruitment Lock

A fleet with active recruitment or replenishment items cannot move; see [recruitment.md](recruitment.md).

## State

The strategic position of a fleet is either a star system or a point along a Route. Its `GalaxyCoords` position is derived from that.

A fleet at a star system is stationed there for actions that require local infrastructure, such as recruitment and replenishment.

## Strategic Consequences

- Fleet speed and Route length directly affect reinforcement time and strategic reach.
- Slow ships reduce the speed of the entire fleet.
- Recruitment creates a temporary commitment to a system: adding new forces trades immediate mobility for future strength.
- The shape of the Route network determines which systems are exposed to which enemies.

## Presentation

- The UI should show the fleet's remaining movement reserve as a continuous value.
- A plotted movement path can extend beyond the distance reachable this turn.
- The reachable portion of that path should be visually distinguishable from the later portion.
- Screen coordinates are presentation state derived from galaxy position and camera/viewport transforms.
- The current campaign wireframe approximates movement and is not the canonical reference for exact movement consumption.

## Prototype

- Fleets do not block or slow hostile movement; a fleet can move past or through a star system occupied by hostile fleets.

## Later

- Zone of control: fleets block or slow hostile movement through the star system they occupy.

## Open Questions

- The exact share of movement reserve an attack costs.
