# Planetary Assault & Conquest

**Status:** DRAFT

Owns how planets are captured and how Garrisons are composed and recover.

## Assault

- An enemy Planet is captured through a `PlanetaryAssault`.
- One Fleet initiates the Assault against a target Planet while stationed in that Planet's star system.
- The Assault is a persistent campaign process, not a single Battle.
- The defender keeps ownership while the Assault is ongoing.
- While a Planet is under Assault, its Production Queue is paused: nothing progresses, and no building or upgrade can be ordered.
- The Assault can continue across multiple rounds and can contain multiple Battles.
- Battles during the Assault use the normal `Battle` model and can therefore involve two or more Armies.
- Fleets can join an ongoing Assault by explicit order while stationed in the Planet's star system: the Planet owner's Fleets on the Garrison's side, and the attacker's faction's Fleets on the attacker's side.
- The initiating Fleet remains the Fleet that started the Assault; other participating Fleets do not need to become additional `PlanetaryAssault.attacker` objects.
- Assault Battles do not have to continue to total annihilation. Armies can survive a Battle and fight again in a later round.
- The Assault ends if the attacker can no longer continue it, or when the defending Garrison is defeated and the Planet is captured.
- The captured Planet keeps its buildings unless a later rule explicitly changes this.

## Garrison

The Garrison concept is defined in [fleets.md](fleets.md). This section owns its composition and recovery.

- Settlement level determines the baseline strength and composition of the Garrison.
- Higher-level Planets can field more serious defensive Squads.
- Garrison Squads take normal ship losses in Battles.
- Surviving Garrison Squads automatically recover some lost ships each round while their Planet is not under Assault.
- Exact Garrison compositions, recovery amounts, and casualty formulas are balance/content data.

## Assault Round Flow

At end-of-round processing, each ongoing Assault resolves one Assault round:

1. resolve this round's fighting between the attacking Army and the defending Garrison;
2. persist the resulting Squad losses;
3. capture the Planet if its Garrison is destroyed; otherwise the Assault continues into the next round unless the attacker can no longer continue it.

## Prototype

An Assault's outcome is decided by Combat Model A and then spread across rounds, so Settlement level buys time without changing who wins:

- When the Assault starts, a full Combat Model A Battle between the attacker and the Garrison is resolved as a prediction. It decides the winner and every Squad's final losses; ship types matter as in any other Battle.
- The Assault lasts `N = 2 × L × min(A, D) / A` rounds, rounded up and at least 1, where `L` is the Planet's Settlement level and `A` and `D` are the total `cost` of the attacker's and the Garrison's ships when the Assault starts.
- After Assault round `i`, every Squad on both sides has taken `i / N` of its predicted losses, rounded to whole ships. After round `N`, both sides match the prediction.
- All Armies on the same side fight the prediction as one combined Army.
- If an Army joins or leaves the Assault, the prediction is resolved again from the current forces, and its losses are spread over the remaining rounds.
- The Planet is captured after round `N` if the prediction destroys the Garrison and at least one attacking ship survives. If the prediction ends without a winner, the Planet is not captured.

Equal forces against a level 1 Settlement fight for 2 rounds, and each Settlement level adds 2 rounds. An attacker twice the Garrison's cost finishes in `L` rounds.

## Strategic Consequence

A multi-round Assault commits military forces and gives other Factions time to react, move Armies into the area, reinforce the defender, attack the assailant, or exploit the commitment elsewhere.

## Open Questions

- Exact Garrison baseline composition by Planet level.
- Exact Garrison recovery amount, including how a fully destroyed Garrison rebuilds.
- What happens to the paused Production Queue items of a captured Planet.
