# Buildings & Construction

**Status:** DRAFT

Owns all buildings, including the Settlement that sets a Planet's development level, and planetary construction.

## Settlement Building

- Every Planet has a mandatory Settlement building in a dedicated slot.
- The Settlement does not consume a regular building slot.
- Settlement level is the Planet development level.
- Main-planet Settlements can reach level 5.
- Secondary-planet Settlements can reach level 3.
- Upgrading the Settlement costs Money and takes a fixed number of rounds.
- Settlement upgrades progress at the end of each round.
- Settlement level determines the number of regular building slots.
- Main-planet regular slots by Settlement level: 1 / 2 / 3 / 5 / 7.
- Secondary-planet regular slots by Settlement level: 1 / 2 / 3.
- The Settlement provides a small amount of income. Exact values are content/balance data.
- A Settlement upgrade requires enough Food in the system; see [economy.md](economy.md).

## Production Queue

- Every Planet has one `ProductionQueue<BuildingDefinition>`.
- New buildings and building upgrades are ordered through that queue.
- Money is paid when an item is ordered. Cancelling an item refunds its full cost.
- The queue is paused while its Planet is under Assault; see [planetary-assault.md](planetary-assault.md).
- Production takes a fixed number of rounds and progresses at the end of each round.
- Only the first queue item is actively progressing; later items wait in order.

## Regular Buildings

- Regular buildings are constructed in Planet building slots.
- A Planet cannot contain two buildings from the same building chain.
- The same building chain can exist on different Planets in the same system.
- Buildings have levels.
- A Building's level cannot exceed the Settlement level of its Planet.
- Upgrading a Building keeps it in the same slot.

## Prototype Building Roles

The prototype requires at least these building families:

- **Food buildings** — increase Food available to the system.
- **Economic buildings** — generate Money; effects stack across Planets.
- **Military building chains** — different chains unlock different groups of ship designs for recruitment and replenishment in the system.

Which ship designs each military chain level unlocks, and where they can be recruited, is defined in [recruitment.md](recruitment.md).

## Effect Scope

- Local effects apply only to the Planet containing the Building.
- Additive system effects from multiple Planets are summed.
- System-wide unlocks use the best relevant Building available in the system unless a specific Building rule says otherwise.

## Prototype Content

- Building roster: [building-roster.md](../content/buildings/building-roster.md).

## Later

- Defensive buildings that add additional or unique Squads to a Planet's Garrison.

## Open Questions

- Building costs, income, Food output, and production durations, including Settlement upgrades.
