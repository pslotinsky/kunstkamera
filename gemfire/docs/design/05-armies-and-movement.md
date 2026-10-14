# 5. Armies & movement

## Description

The bloodless strategic military layer: raise troops, move gold, food, and troops into a neighbor, and claim an unowned province by marching into it.

`Resources.troops` already exists (0–999), is seeded per province, and already renders in the province panel; `RecruitCommand` and `MoveTroopsCommand` exist only as turn-burning stubs. This feature gives them behavior.

In scope: recruit troops with gold; move gold, food, and troops into an adjacent province you own; claim an adjacent neutral province by moving into it.

There is no separate "review army strength" screen — you review a force by setting the gold, food, and troops it carries in the action's own dialog (Move here, Attack later); the spec keeps troops as one abstract province value, so a force is just those resource amounts.

Out of scope: attacking an enemy province and the battle it triggers (feature 8 — so Move never targets an enemy); choosing a commander and assembling an army (that selection lives in the Attack flow, feature 8 — recruiting here only raises the troops an army is later built from); Fifth Units (6); Gem Guardians (7); in-field food consumption and deployment cost (battle); and the tactical split of troops into Horsemen/Knights/Archers (battle).

## Glossary

| Term        | Meaning                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Troops      | A province's military value (`Resources.troops`, 0–999). One abstract pool; unit types exist only in battle.     |
| Recruit     | Spend gold to raise a province's troops. Turn-consuming, goodwill −1.                                            |
| Move Troops | Send gold, food, and troops into an adjacent province you own, or into an adjacent neutral to claim it. Turn, goodwill 0. |
| Claim       | Taking an unowned (neutral) adjacent province by moving into it: it joins your family, ruled remotely.           |

## Functionality

- Recruit: at a province you control, convert gold to troops at 2 gold per troop, capped by gold on hand and the 999 ceiling. Ends the province's turn; goodwill −1.
- Move troops: pick an adjacent province you own, set the gold, food, and troops to send (≤ what the source holds, ≤ the destination's headroom to 999); the amounts leave the source and arrive at the destination. Ends the turn; goodwill 0.
- Claim a neutral: Move Troops into an adjacent neutral province transfers it to your family — ruled remotely by the ruler (half strength, per feature 4) — seeded with the gold, food, and troops you sent. Install a resident lord afterward with Change Lord.

## Use cases

```mermaid
flowchart LR
  player((Player))
  player --> uc1(["Recruit troops with gold"])
  player --> uc2(["Reinforce an adjacent province with gold, food & troops"])
  player --> uc3(["Claim a neutral province by moving into it"])
```

## UI

Every order here is the standard command-dialog model already used by Give Food (one amount) and Transport (map target + amounts) — no new screen, and no dedicated army view.

`Recruit` is a one-amount dialog: "How many troops (0–N)?", N = min(⌊gold / 2⌋, 999 − troops). `Move Troops` highlights the adjacent provinces you own or that are neutral; you pick one on the map, then set Troops, Food, and Gold — that selection is the "review" of the force you commit. A neutral target is labelled as a claim.

```text
+--- Recruit ----------------+   +--- Move Troops ------------+
| How many troops (0-65)?    |   | To 9  (claim)              |
| [____ 40 ____]             |   | Troops (0-120)? [__ 60 __] |
| [ Yea ]        [ Nay ]     |   | Food   (0-123)? [__ 30 __] |
+----------------------------+   | Gold   (0-150)? [__ 40 __] |
                                 | [ Yea ]        [ Nay ]     |
                                 +----------------------------+
```

## Research

**Troops are one abstract province value.** The spec keeps troops as a single province-level number on the map (§6.1); types appear only in battle. This is already `Resources.troops`, so Recruit and Move just add to / move that value — no new structure; a force's fighting strength is simply the troops committed, with food as its campaign supply and gold as carried treasury.

**Recruit costs 2 gold per troop.** This is canonical (spec §4.3, §4.5); there is no confirmed population or food cost, so gold is the only limiter. The dialog caps troops at min(⌊gold / 2⌋, 999 − troops). Turn-consuming with goodwill −1 (appendix-d §D.2, §D.5).

**Move Troops stays separate from Transport.** Appendix-d lists "Transport / Move" as one logistics command, but the manual and codebase split them: Transport (Domestic; gold + food; any province you own, however distant) and Move Troops (Military; gold + food + troops; adjacent only). Both carry gold and food (manual §281, §305), but Move Troops also carries troops, reaches only adjacent provinces, and is the only way to claim a neutral — whereas Transport "differs from MOVE TROOPS in that you can send goods to distant provinces." An enemy neighbor is an Attack (feature 8) and is not offered here. Turn-consuming, goodwill 0.

**Claiming is part of Move.** Entering a neutral province sets its `family` to the player and its `governor` to the ruler — which is feature 4's "ruled remotely" (half-strength) state, so Move writes those two fields and needs no new ownership machinery. A claimed province needs a governor, and the remote ruler is the default; installing a resident lord is a separate, later Change Lord order. Move itself never picks a commander.

## Domain model

```mermaid
classDiagram
  class Province {
    +Resources resources
    +General governor
    +Family family
    +number[] neighbors
    +addResources(gains) void
    +assignGovernor(general) void
  }
  class RecruitCommand {
    +execute() void
  }
  class MoveTroopsCommand {
    +selectableTargets number[]
    +execute() void
  }
  ProvinceCommand <|-- RecruitCommand
  ProvinceCommand <|-- MoveTroopsCommand
  MoveTroopsCommand --> Province : moves gold+food+troops, may claim
  RecruitCommand --> Province : gold -> troops
```

## Flow

```mermaid
sequenceDiagram
  participant Player
  participant Move as MoveTroopsCommand
  participant Source as Source province
  participant Dest as Destination province
  Player->>Move: target = neutral, gold = 40, food = 30, troops = 60
  Move->>Source: addResources(gold -40, food -30, troops -60)
  Move->>Dest: addResources(gold +40, food +30, troops +60)
  Move->>Dest: if neutral, family = player, governor = ruler
  Move->>Source: publish ProvinceUpdated (source & dest), recordAction(0)
```

## Persistence

Nothing new to persist: troops are already part of `Province.resources`, and a claim writes the same `family` / `governor` fields feature 4 already saves. (Save/load itself is feature 17.)

## Tests

- **Recruit (unit):** spends 2 gold per troop, capped by gold on hand; refuses what the province can't afford.
- **Move troops (unit):** into an adjacent province you own, debits the source and credits the destination with the moved gold, food, and troops, ownership unchanged; into an adjacent neutral, claims it for the player — ruled remotely by the ruler — seeded with the moved gold, food, and troops.
- **Selectable targets (unit):** adjacent provinces you own or that are neutral; enemy and non-adjacent provinces are excluded.
```
