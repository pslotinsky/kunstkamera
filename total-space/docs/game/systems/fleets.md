# Armies, Fleets & Squads

**Status:** SPEC

Owns what Armies, Fleets, Garrisons, and Squads are and the properties they carry. How Fleets are formed and grow is defined in [recruitment.md](recruitment.md); how they move, in [movement.md](movement.md).

## Army

- `Army` is the common military-force concept used by combat and other military systems.
- An Army is composed of one or more `Squad`s.
- `Fleet` and `Garrison` are both Armies.
- A Fleet is mobile and travels along Routes.
- A Garrison is permanently attached to a planet and cannot project force across the galaxy as a Fleet can.

## Fleet Rules

- Fleet is the primary mobile strategic military unit.
- A Squad contains ships of one `ShipDefinition` and tracks its current quantity.
- Prototype maximum Squad size is `100` ships for every ship design.
- A fleet has a finite maximum number of Squads. The exact capacity is balance/configuration data.
- Multiple friendly fleets can occupy the same location.
- Fleet composition matters in combat.
- Ship designs have distinct combat roles and soft counter relationships.
- Strong ships are constrained by cost, recurring upkeep, strategic speed, fleet capacity, and counters rather than by a rule that requires mixed fleet composition.
- Every ship design has a strategic speed.
- Fleet speed equals the speed of its slowest completed Squad.
- Fleet split and merge are not implemented in the prototype.

## Garrisons

- Every Planet has one Garrison.
- A Garrison is an Army composed of real Squads rather than a scalar defence value.
- Garrison Squads are local defensive forces and are not stored mobile units waiting to be assigned to a Fleet.
- Garrison composition, losses, and automatic recovery are defined in [planetary-assault.md](planetary-assault.md).

## Later

- Heroes as the explicit commanders of fleets; see [characters.md](characters.md).
- Persistent ship damage, repair, Squad-specific limits, and split/merge.

## Open Questions

- Exact number of Squad slots in a Fleet/Army for the prototype and later balance. The existence of the fleet limit is fixed; only its numeric value remains tuning data.
