# Turns & Rounds

**Status:** DRAFT

Owns the turn and round structure, including when income, upkeep, and end-of-round processes happen.

## Rules

- The game is turn-based.
- A round consists of one turn for each faction.
- Factions always take turns in a fixed order.
- Income is received and upkeep is paid at the start of the faction's turn.
- During its turn, a faction performs available actions in any order unless a system rule states otherwise.
- No action is limited to once per turn; actions are limited only by their own constraints, such as movement reserve, Money, and queues.
- When every faction has finished its turn, the round ends.
- Scheduled processes progress or complete at the end of the round.
- Round-end changes become part of the game state immediately.
- A faction is informed about relevant round-end changes at the start of its next turn.

## Round Flow

1. Faction A starts its turn: notifications, income, upkeep.
2. Faction A acts and ends its turn.
3. Remaining factions do the same in fixed order.
4. End-of-round processes progress or complete.
5. The next round begins.

## Open Questions

- Exact ordering of end-of-round processes if two completed processes directly conflict.
