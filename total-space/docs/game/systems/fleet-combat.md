# Fleet Combat

**Status:** DRAFT

Owns the Battle model and how Battles are resolved.

## Domain Battle Model

- A `Battle` is a combat encounter involving two or more `Army` participants.
- `Fleet` and `Garrison` are both Armies and can therefore participate in the same Battle model.
- A Battle does not require a permanent two-side structure. Additional Armies can join or leave when the surrounding game rules allow it.
- Participating Armies can belong to different Factions and do not have to collapse into exactly two alliance groups.
- A Battle can end with multiple surviving Armies; retreat and non-annihilation outcomes are valid concepts even if a particular prototype resolver does not support them yet.
- Planetary Assault uses the same Battle concept for encounters involving the attacking Fleet, the defending Garrison, and any other eligible reinforcements.

## Combat Model A — Distance

The prototype resolves combat automatically and deterministically in rounds, with three distance bands. The prototype resolver handles two sides at a time, and Armies on the same side fight as one; that limitation does not redefine the broader `Battle` domain concept above. Model A resolves every prototype Battle, including the Battles of a Planetary Assault; how an Assault paces them is defined in [planetary-assault.md](planetary-assault.md).

### Distance

Combat starts at `LONG` range and closes automatically:

- rounds 1–2: `LONG`;
- rounds 3–4: `MEDIUM`;
- round 5 and later: `CLOSE`.

Fleet speed does not yet affect combat distance.

### Ship State

A `ShipDefinition` defines:

- size: `LIGHT`, `MEDIUM`, `HEAVY`, or `CAPITAL`;
- Hull;
- Evasion;
- Point Defence;
- Strategic Speed;
- cost per ship;
- upkeep per ship;
- production rounds;
- one or more weapons.

Prototype ship values are content data in [prototype-ships.json](../content/ships/prototype-ships.json).

### Firing

All surviving ships fire once per combat round with each weapon that has non-zero effectiveness at the current distance.

For a weapon attack:

`expected damage = ship count × Damage × Accuracy × range effectiveness × (1 - target Evasion) × target-size modifier`

Model A uses expected damage rather than random hit rolls. This keeps battle outcomes deterministic and reproducible.

### Target Selection

Each weapon automatically targets a living enemy Squad with the highest target-size modifier for that weapon.

If several Squads have the same modifier, the more expensive ship design is preferred. If they also share the design, the first of them in the enemy Army's order is preferred.

Damage is distributed, not wasted. The ships carrying a weapon fire at targets in that weapon's priority order: each target receives only enough fire to destroy it, counting damage already assigned to it this round, and the remaining ships fire at the next target. Weapons are assigned in the order of their Squads in the Army.

The player does not select individual targets in Model A.

### Point Defence

Point Defence is pooled across the defending Army in Model A.

It applies only to attacks marked as interceptable: currently missiles, torpedoes, and strike craft.

Each combat round:

- total Point Defence is summed across surviving defending ships;
- each Point Defence point cancels `2.0` expected interceptable damage;
- cancelled damage is distributed proportionally across all interceptable attacks;
- Point Defence can reduce interceptable damage by at most 65% in a round.

These values are balance parameters, not final constants.

### Damage and Casualties

Damage within a combat round is simultaneous.

A ship destroyed during a round still contributes its attacks for that round.

Damage is applied to the aggregate Hull of a Squad. Whole ships are removed when enough Hull is lost: a Squad's ship count is its remaining Hull divided by one ship's Hull, rounded up.

Partial Hull damage is tracked only for the duration of the Battle. After Battle, only surviving ship quantities persist.

### Battle End

The prototype resolver continues until one side is destroyed or 20 combat rounds have been fought. A Battle that reaches 20 combat rounds ends without a winner, and both sides keep their surviving ships. If both sides are destroyed in the same combat round, the Battle also ends without a winner.

The wider Battle model is not required to end in total annihilation. Retreat, reinforcement, and multiple-survivor outcomes can be added by later combat models.

## Design Intent

The combat model should make these choices matter:

- Army composition;
- long-range versus close-range damage;
- anti-heavy specialization;
- escort and Point Defence coverage;
- strategic speed sacrificed by adding slow capital ships;
- cost and upkeep of heavy Fleets.

The current resolver is intentionally small enough to replace if distance does not create useful composition decisions.

## Campaign Engagement

- A Battle starts only when a faction explicitly orders one of its Fleets to attack a specific hostile Fleet. Battles never start on their own: hostile Armies can share a star system or a Route without fighting.
- The attacking Fleet must be able to reach its target with its remaining movement reserve.
- Attacking a Planet is a Planetary Assault; see [planetary-assault.md](planetary-assault.md).
- Which factions are hostile to each other is defined in [diplomacy.md](diplomacy.md).
- Additional Armies can later join the same Battle as reinforcements when they are able to participate at that location.
- Armies can leave a Battle through retreat or another allowed exit rule once such mechanics are enabled.
- The exact initiator, initial target, joined participants, survivors, losses, and result are Battle state/statistics; they do not require separate domain classes in the high-level model.
- How a Battle reduces the attacking Fleet's movement is defined in [movement.md](movement.md).

## Battle Presentation Exploration

The candidate battle interaction models are described in [Battle UI Mockups](../../mockups/battle/README.md): autoresolve, replay-only, semi-automatic, turn-based, and real-time-with-pause approaches.

These concepts are exploratory. The rules in this document remain canonical for the current combat prototype until a different combat model is explicitly adopted here.

## Open Questions

- How a multi-Armies Battle resolves hostility when several Factions with different diplomatic relationships participate.
- Exact reinforcement timing and eligibility.
- Exact retreat rules.
- Whether Fleet speed should later control closing or maintaining distance.
- Whether persistent partial ship damage is worth adding.
- Whether combat randomness improves the game after the deterministic model is balanced.
