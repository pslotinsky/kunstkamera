# Recruitment & Replenishment

**Status:** SPEC

Owns how new Squads and Fleets are created, how lost ships are restored, the movement lock while either happens, and which ship designs are available where.

## Prototype Rules

- A Fleet's Squad capacity (see [fleets.md](fleets.md)) counts both completed Squads and active Production Queue items that will create new Squads.
- Recruitment cannot add an item when the destination Fleet has no remaining Squad capacity.
- Fleet capacity is not a star-system limit. There is no separate system-wide Recruitment Capacity and no per-system recruitment-slot limit in the prototype.
- Recruitment is constrained by Money, military infrastructure, production rounds, and the destination Fleet's capacity.
- A newly recruited Squad always contains `100` ships, the maximum Squad size.
- A ship design's `cost` is paid per ship, so recruiting a Squad costs `100 × cost`.
- Money is paid when an item is ordered. Cancelling an item refunds its full cost.
- Recruitment and replenishment progress through normal end-of-round processing.

## Production Queues

- Every Fleet has two Production Queues: a recruitment queue (`ProductionQueue<ShipDefinition>`) for new Squads and a replenishment queue for restoring lost ships to existing Squads.
- The two queues progress in parallel. Within each queue, only the first item progresses; later items wait in order.
- A queued recruitment item represents one future Squad, not individual ships stored at a planet.
- Queued recruitment items are shown as pending Squads inside their Fleet.
- Production Queue ownership identifies the destination Fleet; it does not make the Fleet a mobile shipyard.

## Fleet Formation

- Recruitment is available to Fleets stationed in an eligible owned star system.
- A Fleet does not need to be attached to a specific Planet inside that system.
- Required military building chains can exist on any owned Planet in the same star system; unlocks are aggregated at system level.
- A recruitment order belongs to a specific Fleet from the moment the order is created.
- Recruiting into an existing Fleet adds the new Squad to that Fleet's Production Queue.
- Starting recruitment from the planet-management UI without choosing an existing Fleet creates a new empty Fleet in that star system when the first order is placed.
- A newly created recruiting Fleet can temporarily contain no completed Squads and only queued production items.
- When a recruitment item completes, the new Squad is added directly to its Fleet.

## Recruiting Fleet State

- A Fleet with one or more active items in either queue cannot move.
- It remains in the recruitment system until every active item has completed or been cancelled.
- Completed Squads do not remove the movement lock while other items remain active.
- A recruiting Fleet can receive additional recruitment orders while capacity remains.
- Items can be cancelled while recruitment is still in progress.
- If every recruitment item of a newly created Fleet is cancelled before any Squad completes, the empty Fleet is removed automatically.
- This keeps recruitment attached to its destination Army and avoids an intermediate Planet or system unit-storage pool.

## Replenishment

- Replenishment restores ships to an existing damaged Squad; it does not create a new Squad.
- A replenishment item restores a chosen number of lost ships to one Squad and is placed in the Fleet's replenishment queue.
- Lost ships can be replenished while the Fleet is in an eligible owned star system.
- A ship design can be replenished only if the required military building chain and level exist somewhere in that star system.
- Each replenished ship costs the ship design's `cost`.
- Replenishment takes the ship design's `productionRounds`.

## Military Unlocks

- Different military building chains unlock different groups of ship designs.
- Specific ship designs are unlocked at specific building levels.
- Lower-level unlocks remain available after a building is upgraded.
- The highest relevant building level anywhere in the system determines which ship designs from that chain can be recruited and replenished there.

## Later

In the full game, Heroes take over Fleet formation; see [characters.md](characters.md). The prototype's unnamed Fleet created from planet-management recruitment is a temporary stand-in for that flow.

## Prototype Content

- Building roster: [building-roster.md](../content/buildings/building-roster.md).
- Ship roster and initial tuning values: [prototype-ships.json](../content/ships/prototype-ships.json).
