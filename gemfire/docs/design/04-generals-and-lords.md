# 4. Generals & lords

## Description

Manage the family: see your generals and their stats, choose who lords each province — or rule it yourself from afar at half strength — and move your seat of power. `General`, `Family` (ruler, members, home, fame), and `Province.governor` already exist and are seeded; this feature reads and reassigns them and adds the UI.

In scope: view generals' stats and the ruler's fame; appoint, move, and promote lords; rule a province directly; move the home province.

Out of scope: recruiting generals (only via Defection / capture — features 10, 9) and rewarding generals (no sourced mechanic; hidden general loyalty isn't modeled until Defection — feature 10). We only seed the vassal pool those will use.

## Glossary

| Term          | Meaning                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Ruler         | The family head. The only member with **Fame** and the only one who can issue Change Lord.        |
| Lord          | The general governing a province — resident, full strength. A general lords at most one province. |
| Vassal        | A member governing no province — the pool Change Lord promotes from (and Defection/capture fill). |
| Home province | The ruler's seat: governed by the ruler at **full** strength, and where ruler-level orders issue. |
| Rule directly | The ruler governs a non-home province remotely, at **half** its stats. No resident lord.          |
| Fame          | A ruler-only score, 0–100 (`Family.fame`). Feeds Ally/Defection/Surrender later; here only shown. |

## Functionality

- Open **View** — a free, tabbed info overlay over the map (no turn, per appendix-d). **General** is a table whose first cell is an officer card (portrait, title — ruler / lord / vassal — name, and age) followed by Intelligence / War / Charisma, the ruler's Fame, and posting. **Land** lists the family's provinces: status (capital / lorded / ruled remotely), governor, and development. (**Age** = scenario year − birth year; birth years come from the DragonAtma stat guide in its year-201 epoch, which scenario 1 now uses, with the unknown birth month randomized at world creation. **Gems** comes with feature 7, **5th Unit** with feature 6.)
- Change a province's lord: promote a **vassal**, **move** a lord in from elsewhere, or hand it to **You** (the ruler, remote at half strength). A displaced lord returns to the pool; a province a lord leaves reverts to "You".
- Move the home province: the ruler relocates, the new seat becomes full-strength, the old reverts to "You". This alone among the feature's orders ends the turn.
- Develop and Give Food read the province's **effective** stats, so a remotely-ruled province yields half.

## Use cases

```mermaid
flowchart LR
  player((Player))
  player --> uc1(["View officers' stats and the ruler's fame"])
  player --> uc2(["View the family's lands and their status"])
  player --> uc3(["Appoint a vassal, move a lord, or rule directly"])
  player --> uc4(["Move the home province (ends the turn)"])
```

## UI

`View` is a free overlay drawn over the map (not the command rail), with **General** and **Land** tabs and a Close button — no turn, per appendix-d. Each tab is a table: General lists officers (rank, name, posting, INT/WAR/CHA, the ruler's Fame); Land lists provinces (status — capital / lorded / ruled remotely — name, governor, development). The province info panel keeps only the governor's portrait and name — a general's stats and the ruler's Fame live in View's General tab. `Change Lord` is its own dialog in the command rail, ruler-only and offered only from the home province; the target province is **picked on the map** (the family's non-home provinces highlight as selectable, like Transport's destination), then the dialog asks who governs it. "move the ruler here" is the turn-ending move-home path, the rest are free.

```text
+--- map overlay: View ----------------------+   +--------------------------------+
| [General] [Land]                     Close |   | Change Lord                    |
|  +----+ Ruler        INT WAR CHA Fame Post |   | Province 7: Rodale  (pick map) |
|  |pic | Erin          82  87  76   9  Card |   | New lord:                      |
|  +----+ (Age)                              |   |  ( ) You    (rule from Cardyf) |
|  +----+ Lord                               |   |  (o) Anselm (vassal)           |
|  |pic | Anselm        76  52  75   —  Roda |   |  ( ) Karl   (move from Hyland) |
|  +----+ (Age)                              |   |  ( ) Move the ruler here (ends)|
+--------------------------------------------+   | [ Confirm ]        [ Cancel ]  |
                                                 +--------------------------------+
```

## Research

**The half-strength ruler is the one real rule.** Sources are explicit: the ruler governs at half strength anywhere but home (FAQ: "half"; Hartman: "lowered greatly"). We model it as derived state, not a stored modifier — a province is remotely ruled when `governor === owner.ruler && this !== owner.homeProvince`; `Province.effective(stat)` halves there, returns the full value otherwise, 0 with no governor. Develop and Give Food switch from `governor.stats.x` to `province.effective(x)`, so the penalty lives in one place.

**Lordship is reassignment, not new structure.** `Province.governor` already runs end to end. Change Lord rewrites it: promote a vassal, move a lord (their old province reverts to "You"), or choose "You". The vassal pool is derived — `members` minus the ruler minus current governors — so there is no assignment field to sync. Change Lord is ruler-only, home-only, and consumes no turn (appendix-d), with one exception: moving the ruler to a new province relocates the home seat and **ends the turn** (FAQ).

**Fame is display-only.** Fame is the ruler's alone (`Family.fame`); its swing formula is unresolved (`appendix-d` D.6) and its consumers are later features, so this feature only reads it.

## Domain model

```mermaid
classDiagram
  class Family {
    +General ruler
    +General[] members
    +Province homeProvince
    +int fame
    +vassals(map) General[]
  }
  class Province {
    +Family owner
    +General governor
    +bool isRemotelyRuled
    +assignGovernor(general) void
    +effective(stat) int
  }
  class General {
    +Characteristics stats
    +bool isRuler
  }
  class ChangeLordCommand {
    +execute() void
    +moveHome() void
  }
  Family "1" *-- "many" General : members
  Family --> Province : homeProvince
  Province --> "0..1" General : governor
  General *-- Characteristics
  WorldCommand <|-- ViewCommand
  WorldCommand <|-- ChangeLordCommand
  ChangeLordCommand --> Province : reassigns governor
```

## Flow

```mermaid
sequenceDiagram
  participant Player
  participant Dialog as ChangeLord
  participant Command as ChangeLordCommand
  participant Family
  participant Province
  Player->>Dialog: target = Rodale, lord = Anselm (vassal)
  Dialog->>Command: assign(Rodale, Anselm), then execute
  Command->>Province: Rodale.assignGovernor(Anselm), publish ProvinceUpdated
  Player->>Dialog: (alt) move the ruler here
  Dialog->>Command: moveHome(Rodale)
  Command->>Family: homeProvince = Rodale, old seat becomes You
  Command->>Province: publish ProvinceUpdated, TurnEnded
```

## Tests

- **Effective stats (unit):** full for a resident lord and the ruler at home, `floor(stat/2)` for the ruler on a non-home province, 0 with no governor — and Develop/Give Food consume `effective`, so a remotely-ruled province develops at half.
- **Change Lord (unit):** moving a lord reverts their old province to "You" and returns any lord displaced at the destination to the pool; `canExecute` is false off the home province or for a non-ruler.
- **Move home (unit):** relocates `homeProvince`, makes the ruler the new seat's full-strength governor, sends the old seat remote, and ends the turn.
