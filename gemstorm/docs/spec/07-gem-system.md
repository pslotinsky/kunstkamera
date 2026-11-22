# 7. Gem System

## Purpose

This chapter describes the Gem system in Gemfire.

Gems are unique magical artifacts associated with noble houses of Ishmeria. In gameplay, they function as strategic house-level assets that allow a house to use powerful Gem Guardians as Fifth Units during tactical battles.

The Gem system connects:

- the story premise;
- noble house rivalry;
- Fifth Units;
- family absorption;
- ruler survival;
- long-term military power.

---

## 7.1 Gemfire and Gems

### Overview

Gemfire is a magical crown in which the king inlaid seven Gems:

- six wizard Gems;
- the Dragon Gem.

Only six of them are loose in Ishmeria. Princess Robyn "worked the magical gems out of the crown and hurled them into the midnight sky", and her father caught her as she struggled with "the very last stone, the red ruby of the dragon", which never left the crown (manual, The Legend of Gemfire).

The six scattered across Ishmeria and came into the possession of noble houses.

The Dragon is therefore the crown itself, still in Eselred's hands at Lankshire — not a seventh scattered stone.

---

### Narrative Role

Gems are both magical artifacts and symbols of political authority.

Control over a Gem gives a house military power through its Guardian, but it also reinforces the house’s claim to rule Ishmeria.

---

### Design Observation

Gems are one of the main ways Gemfire ties lore to mechanics.

The same object matters in three layers:

```text
Narrative authority
+
House-level political power
+
Battlefield Fifth Unit access
```

---

## 7.2 Gem Ownership

### Confirmed Facts

A Gem is not owned by an individual general.

A Gem is not owned by a province.

A Gem is a house / family-level asset.

```text
House / Family
↓
Gem
↓
Gem Guardian
```

---

### Ownership Model

```mermaid
flowchart TD
    Family["House / Family"] --> Gem
    Gem --> Guardian["Gem Guardian"]
    Guardian --> FifthUnit["Fifth Unit"]
```

---

### Design Observation

A Gem is more flexible than a hired Fifth Unit.

A hired Fifth Unit is tied to a province and must be moved through logistics. A Gem belongs to the house, so its Guardian can be selected when the Gem is available and the battle allows a Fifth Unit.

---

## 7.3 Gem Guardians

### Overview

Each Gem allows the owning house to use its associated Gem Guardian.

A Gem Guardian occupies the army’s Fifth Unit slot.

Gem Guardians use Strength instead of normal troop count.

---

### Confirmed Gem Guardians

There are seven Gem Guardians, including the royal Dragon retained by Lankshire / Eselred; their full stats (Strength, Move, Range) and owning house are canonical in Appendix C §C.3, with per-scenario ownership in Appendix B §B.3 and each guardian's gemstone and element in Appendix E §E.6.

---

### Battlefield Role

Gem Guardians are among the strongest Fifth Units in the game.

They can give a house a major battle advantage, especially against armies that rely only on standard units or weaker hired Fifth Units.

Exact Guardian statistics, movement values, and range patterns are maintained in the military data appendix.

---

## 7.4 Gem Guardians as Fifth Units

### Usage

If a house owns a Gem and the Gem is available, its Guardian may be selected as the army’s Fifth Unit.

```text
Available Gem
↓
Select Guardian as Fifth Unit
↓
Use in Battle
↓
Gem enters cooldown
```

---

### Difference from Hired Fifth Units

| Aspect          | Gem Guardian           | Hired Fifth Unit                  |
| --------------- | ---------------------- | --------------------------------- |
| Ownership       | House / Family         | Province                          |
| Cost            | No hiring cost         | Requires hiring cost              |
| Upkeep          | None                   | Requires upkeep                   |
| Death           | Cannot permanently die | Can be destroyed or desert        |
| Availability    | Controlled by cooldown | Controlled by location and upkeep |
| Strategic value | High and reusable      | Variable and local                |

---

### Design Observation

Gem Guardians are reusable elite Fifth Units.

They are powerful and reliable, but limited by cooldown and Strength attrition.

---

## 7.5 Cooldown System

### Confirmed Facts

A Gem cannot be used continuously.

After being used in battle, a Gem becomes unavailable for a period of time.

---

### Cooldown Rules

A Gem enters cooldown for 3 months when its Guardian joins a battle, however the battle goes for it. An older summary gave 5 months after a defeat; the [detailed rule](#detailed-rules-gems) has a single 3-month rest.

---

### Conceptual Flow

```mermaid
flowchart TD
    Available["Gem Available"]
    Battle["Used in Battle"]
    Cooldown3["3-Month Cooldown"]

    Available --> Battle
    Battle --> Cooldown3
    Cooldown3 --> Available
```

---

### Design Observation

Cooldown prevents Gem Guardians from dominating every battle.

The player must decide when a Gem is worth committing:

```text
Use the Gem now
or
save it for a more important battle
```

---

## 7.6 Strength and Battle Limits

### Strength

Gem Guardians use Strength instead of troop count.

Strength represents the Guardian’s combat power and durability.

---

### Strength Loss

Gem Guardians lose Strength when attacking.

A Gem Guardian loses 10% Strength per attack (this applies when it attacks), even if the target is weak.

---

### Death Immunity

A Gem Guardian cannot permanently die.

If beaten down, it withdraws from the field instead of being destroyed, and rests the same 3 months as any Guardian that fought.

---

### Design Observation

Gem Guardians combine high power with built-in attrition.

They are not disposable units, but they also cannot be used carelessly. A Gem Guardian can win a critical battle, but repeated attacks reduce its effective strength during that battle.

---

## 7.7 Gem Transfer

### Province Capture

Capturing a single province does not automatically transfer the enemy house’s Gem.

Gem ownership belongs to the family, not to the province.

```text
Capture province
↓
Gain territory and local resources
↓
Enemy family keeps Gem if the family still exists
```

---

### Family Absorption

A Gem transfers with the family. If a family surrenders, the victor gains its Gems. If a ruler is recruited and the family absorbed, the victor gains its Gems. If a ruler is banished with no heirs, the banisher gains its Gems. Capturing a single province does not transfer Gem ownership while the family still exists. Exact edge cases remain unresolved.

> **Note:** these rules describe the *mechanic*. Cross-scenario Gem placements
> (Appendix B.3) are authored and do not always follow the conqueror — e.g.,
> Flax defeats Coryll, yet Empyron passes to Tate, not Flax.

Per the manuals, the Search command can also look for Gems: Search reveals which families hold them but never transfers one. Acquisition is solely through family absorption above.

---

### Transfer Model

```mermaid
flowchart TD
    Family["Owning Family"]
    Absorbed{"Family absorbed or disbanded?"}
    Keep["Family keeps Gem"]
    Transfer["Gem transfers to victor"]

    Family --> Absorbed
    Absorbed -->|No| Keep
    Absorbed -->|Yes| Transfer
```

---

### Design Observation

Gem transfer reinforces the importance of rulers and family survival.

The fastest path to acquiring a Gem is not necessarily conquering every province. It may be eliminating, absorbing, or forcing the surrender of the family that owns it.

---

## 7.8 Multiple Gems

### Overview

A house can control more than one Gem.

This can happen through:

- family surrender;
- ruler recruitment;
- family collapse;
- absorption of rival houses.

---

### Strategic Effect

Multiple Gems give a house several advantages:

- access to different Guardian abilities;
- ability to rotate Gems around cooldowns;
- reduced dependence on hired Fifth Units;
- stronger offensive and defensive flexibility.

---

### Design Observation

Gem accumulation acts as a strategic snowball mechanic.

A successful house becomes more dangerous not only because it controls more provinces, but because it gains access to more magical assets.

---

## 7.9 Pastha Exception

### Overview

Pastha is a special Fifth Unit, but it is not a Gem Guardian and not a hired Fifth Unit.

Pastha is obtained through a favourable event.

---

### Key Differences

| Aspect      | Pastha                 |
| ----------- | ---------------------- |
| Source      | Good event             |
| Cost        | Free                   |
| Upkeep      | None                   |
| Reusability | One battle only        |
| Category    | Event-based Fifth Unit |

---

### Design Observation

Pastha is useful as a comparison point because it also occupies the Fifth Unit slot.

However, Pastha is not part of Gem ownership. It belongs to the event system and should not be treated as a Gem Guardian.

---

## 7.10 Strategic Role of Gems

### Military Role

Gem Guardians provide powerful Fifth Units for tactical battles.

They can help a house win battles that would be difficult with standard troops alone.

---

### Political Role

Gems are tied to family survival and absorption.

Acquiring an enemy Gem is part of consolidating power over Ishmeria.

---

### Economic Role

Gem Guardians reduce dependence on hired Fifth Units.

Because they do not require upkeep, they are more reliable than mercenary or monster units.

---

### Strategic Tradeoff

Gem Guardians are powerful but limited by:

- cooldown;
- Strength loss from attacking;
- the single Fifth Unit slot.

The player must decide:

- when to deploy a Gem Guardian;
- when to save it;
- whether to use hired units while Gems recover;
- which Gem is most appropriate for a battle.

---

## 7.11 Gem System Summary

### Reconstructed Gem System

```mermaid
flowchart TD
    House["House / Family"] --> Gem
    Gem --> Guardian["Gem Guardian"]
    Guardian --> FifthUnit["Fifth Unit Slot"]
    FifthUnit --> Battle

    Battle --> Used["Gem Used"]
    Used --> Cooldown["3-Month Cooldown"]

    Cooldown --> Gem

    House --> Collapse["Family Absorbed / Disbanded"]
    Collapse --> Transfer["Gem Transfers to Victor"]
```

---

---

## Detailed rules: Gems

### Holding and using

- Gems belong to the **family**, not to a province or a general.
- Each Gem gives one Gem Guardian, usable from any province of the family, always at full Strength, with no cost or upkeep. It cannot be dismissed.
- The seventh Gem gives the Dragon. It follows every Gem rule: same rest, same transfer, no special condition to gain or keep it.

### Rest

```text
when a battle is joined: rest = 3 for the Gem unit of each side
start of every month:    rest −= 1   (stops at 0)
```

While rest is above 0 the Guardian cannot be chosen for attack or defence. It is usable again in the third month after the battle.

Rest is set when the battle starts, whether or not the Guardian's special attack is used.

### Transfer

All of a family's Gems pass to another family in these cases:

| Case                                                                 | Gems go to                          |
| -------------------------------------------------------------------- | ----------------------------------- |
| Ruler captured and the family taken over                             | The victor                          |
| Ruler released, but the family has no province and nowhere to flee   | The victor                          |
| Ruler banished with no heir                                          | The victor                          |
| Family joins another through diplomacy                               | The receiving family                |
| Ruler dies of old age with no successor                              | Each Gem to a random surviving family |

A ruler banished **with** an heir keeps the family's Gems.

No stat, Fame value, or other hidden condition affects Gem acquisition or retention.

---

---

## Detailed rules: The Dragon

- The Dragon is the unit granted by the seventh Gem. Each Gem is named by its Guardian.
- **Lankshire holds the Dragon at the start of every scenario.** No other family ever starts with it.
- It changes hands only as every Gem does. There is no scripted event, no requirement to hold the other six, and no other way to obtain it.
- Because Lankshire cannot surrender, the Dragon is won by capturing or outliving its ruler.
- If a ruler dies of old age with no heir, each of his Gems goes to a **random** surviving family. The Dragon can reach anyone this way, including a newly founded family.
- It rests for three months after a battle, like the six Guardians.
- In battle it is the strongest unit in the game: Attack 30, Defence 30, Strength 160, Move 2, and the widest range (all tiles within 2). Otherwise it follows the special-unit rules of [Tactical Battle](./09-tactical-battle-system.md#detailed-rules-tactical-battle). (Likely — no Dragon-specific battle code exists.)

**Gems have no effect on victory.** The game ends only by unification. Gem count matters to exactly one rule: a computer family's answer to an alliance proposal.

---

---

## Summary

The Gem system is one of Gemfire’s central systems.

Gems are house-level magical assets that allow a house to use powerful Gem Guardians as Fifth Units.

Unlike hired Fifth Units, Gems:

- belong to a family rather than a province;
- require no upkeep;
- cannot permanently die;
- are limited by cooldown;
- transfer through family absorption rather than ordinary province capture.

The Gem system connects battlefield power, political consolidation, family survival, and the game’s core story premise.
