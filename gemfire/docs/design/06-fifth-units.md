# 6. Fifth Units — Design

## Description

The hiring economy for the special units that fill an army's fifth slot: hire province-based monsters or elite mercenaries with Gold, keep them alive by paying quarterly upkeep (or watch them desert), and dismiss any no longer worth the cost.

`HireMonsterCommand` already exists as a turn-burning stub. This feature gives it behaviour — the one command both hires and dismisses (FAQ §6.3) — introduces the `HiredUnit` domain entity and its catalogue, and adds a quarterly upkeep tick to the turn engine.

In scope: hire available Fifth Units for Gold (a province stations several — one of each type it hires); pay their upkeep every three months or lose them to desertion; dismiss a stationed unit; carry one stationed unit along when moving troops into a neighbour (§8.6); and see a province's stationed units through View. The last two reach back into feature 5's Move Troops and the View command, which had nothing to carry or show until Fifth Units existed.

Out of scope: the battle itself and the fifth army slot it fills (feature 9 — so a hired unit's Move, Range, flying, and Strength loss are recorded for later but unused here); Gem Guardians (feature 8) and Pastha (feature 15), the other two things that can fill the fifth slot; rampage and mercenary loss-of-faith (§8.10 — rules unconfirmed, so desertion-on-unpaid is the only loss modelled); and dynamic changes to a province's hire pool over time (§8.3 — unconfirmed, so availability is static per scenario).

## Glossary

| Term         | Meaning                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Fifth Unit   | The single special unit in an army's fifth slot; can be a Hired Fifth Unit, a Gem Guardian, or Pastha (§6.4).            |
| Hired Fifth Unit | A province-owned special unit hired through Hire Monster — a monster or an elite mercenary. Modelled as `HiredUnit`. |
| Strength     | A Fifth Unit's combat value, used instead of a troop count (§8.7). Set from the catalogue at hire time.                  |
| Hire pool    | The set of unit types a given province may hire, seeded per scenario from the ROM `mercenaries` data (§8.3).             |
| Cost         | A unit's Gold price — paid once to hire, and again as upkeep each quarter (they are the same number, §8.5).              |
| Upkeep       | The recurring Gold charge per hired unit, every three months; non-payment causes desertion.                              |
| Desertion    | Automatic loss of a hired unit when its province cannot pay upkeep.                                                      |
| Dismiss      | Voluntarily releasing a hired unit; no Gold is refunded (§8.11).                                                         |

## Functionality

- Hire: at a province you control, pick a type from its hire pool — any available type it does not already station — and pay its Gold cost; the unit joins the province at its catalogue Strength. Ends the turn; goodwill 0.
- Several per province: a province stations multiple hired units, one of each type it hires. Hiring is blocked only for a type already stationed there; a same-type duplicate can still arrive by Move Troops (§8.6, out of scope here).
- Upkeep: every three months, each stationed unit charges its cost in Gold against its province; any the province cannot pay desert.
- Dismiss: release a stationed unit, dropping its upkeep; no refund. Hire and dismiss are the same order (Hire Monster). Ends the turn; goodwill 0.
- Move a unit: a Move Troops order into an adjacent province may carry one of the source's stationed units along; it relocates from the source to the destination (which may be a freshly claimed neutral). It rides the same order — no extra turn, no goodwill change. Units move only via Move Troops, not Transport.
- View units: View lists each province's stationed Fifth Units (name and Strength) in its overview, and the province info panel shows them too. Free — View consumes no turn.

## Use cases

```mermaid
flowchart LR
  player((Player))
  player --> uc1(["Hire a Fifth Unit from a province's pool"])
  player --> uc2(["Dismiss a hired Fifth Unit"])
  player --> uc4(["Carry a Fifth Unit along when moving troops"])
  player --> uc5(["View a province's stationed Fifth Units"])
  clock((Quarter))
  clock --> uc3(["Charge upkeep, or desert the unit if unpaid"])
```

## UI

One Hire Monster dialog manages a province's Fifth Units: it lists the units already stationed there (each with a Dismiss action) and, below, the types still hireable — the province's pool minus the types it already stations — each showing the static facts the game displays (name, Strength, cost), inputs and flavour only, never a predicted battle outcome. It is a Military command, under the Military tile beside Attack, Recruit, and Move Troops.

```text
+--- Hire Monster ----------------------+
| Stationed                             |
|   Ogre     str 100      [ Dismiss ]   |
| Hire                                  |
|   [ Orks    str 100   20g ]           |
|   [ Bugbear str 100   30g ]           |
|   [ Wyverns str 150   60g ]           |
| [ Done ]                              |
+---------------------------------------+
```

A stationed type drops out of the Hire list (no duplicate hires). The province info panel also lists the units a province holds.

`Move Troops` gains a Fifth-Unit picker below its Troops / Food / Gold fields: the source's stationed units, plus "none" — pick one to send along.

```text
+--- Move Troops (excerpt) ----+
| ...Troops / Food / Gold...   |
| Bring a 5th unit?            |
|   (•) none                   |
|   ( ) Ogre     str 100       |
|   ( ) Bugbear  str 100       |
+------------------------------+
```

`View` lists each province's stationed Fifth Units (name, Strength) in the family overview, beside the lord and stats already shown there.

## Research

**`HiredUnit` now, not a `FifthUnit` hierarchy yet.** Only hired units exist in this feature; Gem Guardians (8) and Pastha (15) also fill the fifth slot but arrive later. We model the concrete `HiredUnit` and add a shared `FifthUnit` seam when the second occupant lands, rather than abstracting speculatively.

**Several units per province; hiring blocks duplicate types.** A province stations multiple hired units — confirmed in play — held as a list (`hiredUnits`). The hire constraint reads straight off that list: the Hire menu is the province's `hirePool` minus the types it currently stations, so you cannot hire a type you already hold. The stationed units are the source of truth — no separate per-type flag to keep in sync. The single fifth *army* slot (§6.4) is a battle-time constraint, not a cap on what a province may station. Move Troops can still bring in another unit, even a same-type duplicate (§8.6 — out of scope here), so the holdings are a list, not a set keyed by type. (The ROM `mercenaries` data only seeds the start state: each entry's `available` flag → the province's `hirePool`, its `hired` flag → the units already stationed there at scenario start.)

**Catalogue in config, battle stats deferred.** The fifteen units and their Strength / Cost are canonical in appendix-c §C.4 (e.g. Bugbear: Strength 100, 30 Gold). Config mirrors the fields this feature uses — type, category, strength, cost. Move, Range, and flying are battle-only (appendix-c §C.6/§C.7) and are added to the catalogue when feature 9 needs them, not now.

**Availability is per-scenario province data.** Each province's hire pool comes from the ROM `mercenaries[].available` flags (§8.3), which differ by scenario — so it is seeded with the rest of the scenario's province state, like ownership and resources. Dynamic availability changes (§8.3, unconfirmed) are out of scope; the pool is fixed for the campaign.

**Upkeep is a month-start engine tick, like Tax & Harvest.** `TaxAndHarvest` runs every month-start and self-guards on September. Upkeep follows the same shape: a `WorldCommand` run at month-start that acts only on quarter months. The spec confirms "every three months" but not the anchor month (§8.5), so the quarter months are a single config constant and the exact set is an open question. When a province stations several units and cannot pay for all, which desert (order, or all-or-nothing) is also unconfirmed; the model charges them in turn and deserts each one the remaining Gold cannot cover.

**Hire and dismiss are one command.** The FAQ is explicit: Hire Monster "allows the player to both hire and fire 5th Units" (§6.3). Since a province holds several units, the natural surface is one dialog that lists the stationed units to dismiss and the remaining types to hire — not a separate Dismiss tile (appendix-d does list a "Dismiss Fifth Unit" entry, but the FAQ and the multi-unit management view override that). Turn-consuming, goodwill 0; whether dismissal alone consumes the turn is "needs verification" in appendix-d, so it is flagged.

**"Magician" is not a thing.** The roadmap bullet says "monster, skilled fighter, or magician," but §8.2 has only two categories — Monster and Elite Human (mercenary). The only magic-users in Gemfire are the lore's six wizards, who are Gem Guardians (feature 8), not hireable. The category modelled here is `'monster' | 'mercenary'`.

## Domain model

```mermaid
classDiagram
  class HiredUnit {
    +string type
    +UnitCategory category
    +number strength
    +number cost
  }
  class Province {
    +HiredUnit[] hiredUnits
    +string[] hirePool
    +station(unit) void
    +release(unit) void
    +stations(type) boolean
  }
  class HireMonsterCommand {
    +hireableTypes string[]
    +hire(type) void
    +dismiss(unit) void
    +execute() void
  }
  class MoveTroopsCommand {
    +carry(unit) void
    +execute() void
  }
  class UpkeepCommand {
    +execute() void
  }
  ProvinceCommand <|-- HireMonsterCommand
  ProvinceCommand <|-- MoveTroopsCommand
  WorldCommand <|-- UpkeepCommand
  HireMonsterCommand --> Province : hire (station) / dismiss (release)
  MoveTroopsCommand --> Province : relocate (release + station)
  UpkeepCommand --> Province : charge each, desert (release) unpaid
  Province --> HiredUnit : stations many
```

The catalogue (`HIRED_UNITS` in config) maps each type to its `category`, `strength`, and `cost`; `HiredUnit` instances are built from it at hire time. `Province.hirePool` is the list of types that province may hire, seeded per scenario; `hireableTypes` is that pool minus the types it already stations. `station` / `release` are the neutral add / remove primitives: a dismiss, a desertion, and the source side of a relocation all call `release`. `HireMonsterCommand` carries one pending action — a chosen type to hire or a stationed unit to dismiss — applied in `execute()`. `MoveTroopsCommand.carry(unit)` relocates one stationed unit by releasing it from the source and stationing it on the destination (feature 5's command, extended here). View reads `hiredUnits` for display and mutates nothing.

## Flow

```mermaid
sequenceDiagram
  participant Player
  participant Hire as HireMonsterCommand
  participant Prov as Province
  Player->>Hire: hire("Bugbear")
  Hire->>Prov: gold >= cost and not already stationing Bugbear?
  Hire->>Prov: addResources(gold -cost), station(unit)
  Hire->>Prov: publish ProvinceUpdated, recordAction(0)
```

```mermaid
sequenceDiagram
  participant Engine
  participant Up as UpkeepCommand
  participant Prov as Province
  Engine->>Up: execute() at month start
  Up->>Up: quarter month? else stop
  loop each stationed unit
    alt gold >= upkeep
      Up->>Prov: addResources(gold -upkeep)
    else cannot pay
      Up->>Prov: dismiss(unit) (desertion)
    end
  end
  Up->>Prov: publish ProvinceUpdated (per touched province)
```

## Persistence

Each province contributes its `hiredUnits` (each unit's type plus current Strength, since Strength will erode in battle later) and the `hirePool` of types it may hire. Nothing else is new; the charge and desertion mutate the same `Province.resources.gold` already saved. (Save/load is feature 17.)

## Tests

- **Hire (unit):** spends the unit's cost in Gold and stations it at the province at its catalogue Strength; lets a province hold several different types; refuses when the province lacks the Gold, when the type is not in its pool, or when it already stations that type.
- **Upkeep (unit):** on a quarter month, charges each stationed unit's cost against its province; deserts a unit the province cannot pay; charges nothing on a non-quarter month.
- **Dismiss (unit):** removes a chosen stationed unit and refunds no Gold.
- **Carry a unit (unit):** a Move Troops order carrying a stationed unit relocates it — gone from the source, stationed at the destination (including a freshly claimed neutral) — and leaves the source's other units in place.
