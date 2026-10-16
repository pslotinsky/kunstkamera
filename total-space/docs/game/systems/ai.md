# AI

**Status:** SPEC

## Rules

- AI factions obey the same game rules as human-controlled factions.
- AI uses only information available to its faction.
- AI performs the same game actions available to a human player.
- Any faction can be AI-controlled so the campaign can run without a human player.

## Prototype

The prototype AI uses a simple priority tree with local scoring rather than long-horizon planning. Neutral factions use only the Food constraint, Planet development, and Economy priorities.

### Turn Priorities

On its turn the AI evaluates, in order:

1. **Immediate threat** — defend threatened planets or fleets.
2. **Favourable fleet battle** — attack a nearby enemy fleet when expected outcome is acceptable.
3. **Vulnerable enemy planet** — start or continue a planetary assault.
4. **Fleet losses** — replenish damaged Squads where replenishment is available.
5. **Military shortage** — recruit new Squads into a suitable existing fleet, or create a new fleet when another mobile force is strategically useful and fleet capacity allows it.
6. **Food constraint** — build or upgrade Agriculture when Food blocks desired planet development.
7. **Planet development** — upgrade a Settlement when affordable and useful.
8. **Economy** — build or upgrade economic infrastructure.
9. **Military infrastructure** — build or upgrade a military chain when access to stronger ship types is useful.
10. **Positioning** — move fleets toward threats, enemy territory, or strategically useful systems.

A fleet with active recruitment or replenishment items is not considered movable until they finish or the AI cancels them.

### Scoring

When several actions satisfy the same priority, the AI chooses using a simple score based on relevant factors such as:

- target value;
- distance;
- expected losses;
- strategic position;
- cost;
- current treasury and upkeep;
- remaining fleet capacity;
- time during which recruitment or replenishment will keep the fleet stationary.

Exact weights are tuning data and should be tested through AI-only simulation.
