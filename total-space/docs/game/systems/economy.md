# Economy

**Status:** DRAFT

Owns the game's resources: Money and Food. When income arrives and upkeep is paid is defined in [turns.md](turns.md).

## Money

- Money is the primary universal economic currency.
- Money is stored in a faction-level treasury.
- Income comes from Settlements and economic buildings; see [buildings.md](buildings.md).
- Construction, planet development, ship recruitment, and ship replenishment consume Money.
- Fleets have recurring upkeep from the prototype onward.
- A ship design's `upkeep` is paid per ship.
- Upkeep can push the treasury below zero.
- There are no administrative costs in the prototype.
- There is no separate Production resource.
- There is no separate supply or provisions resource in the prototype.

## Food

- Food is produced by dedicated buildings.
- Food is evaluated at star-system level.
- Planet development requires enough Food in the system to support the target Settlement level.
- Food therefore limits how far the planets of a system can be developed.

## Open Questions

- Prototype economic-building income values.
- Settlement income by level.
- Food production and requirement values.
- Fleet upkeep formula beyond the per-ship sum.
- Whether Food is purely a current system balance or can be stored/transferred.
- Whether a negative treasury has consequences beyond preventing unaffordable spending.
