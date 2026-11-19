# 6. Military System

## Purpose

This chapter describes Gemfire’s strategic military system.

The military system connects the strategic map with tactical battles. On the strategic map, the player manages troops through provinces, chooses commanders, allocates food, moves forces, and invades adjacent territories. When an invasion begins, the army is converted into a small set of tactical units for battle.

The main purpose of the military system is territorial expansion through the capture of enemy provinces.

---

## 6.1 Strategic Military Resources

### Troops

Troops are the main military resource of a province.

On the strategic map, Troops are stored as a single province-level value.

Troop types are not managed separately on the strategic map.

Standard tactical unit types only appear when an army enters battle.

---

### Food

Food is required to supply an army during a campaign.

An army can lose a battle through starvation even if its units have not been destroyed.

Food therefore functions as both an economic resource and a military timer.

---

### Gold

Gold supports military activity through:

- recruiting Troops;
- hiring Hired Fifth Units;
- paying Hired Fifth Unit upkeep;
- paying deployment costs for attacks.

Attacks require a deployment cost of Troops / 8 + 10 Gold.

---

### Design Observation

On the strategic map, military power is abstract.

The player does not build separate cavalry, infantry, or archer units. Instead, the player manages Troops, commanders, Food, and Fifth Units. The fixed tactical unit structure appears only when battle begins.

---

## 6.2 Commanders

### Overview

Each army has one commander.

The commander may be:

- the ruler;
- a vassal / general;
- the lord / governor of a province.

---

### Commander Role

The commander:

- leads the army;
- influences battle performance through WAR / Military;
- can be captured after defeat;
- does not occupy a battlefield cell;
- does not count as one of the tactical units.

---

### WAR / Military

WAR represents the commander’s military ability.

High WAR improves army effectiveness in battle.

Known or strongly supported effects include:

- stronger tactical performance;
- improved attack results;
- reduced disadvantage in combat.

Exact damage formulas and WAR modifiers remain unresolved.

---

### Design Observation

A general is a commander, not a tactical unit.

The army always consists of its standard tactical units plus an optional Fifth Unit. The commander influences those units rather than appearing as a separate battlefield piece.

---

## 6.3 Strategic Warfare

### Attack

An Attack targets an adjacent enemy province.

Before launching an attack, the player chooses or allocates:

- attacking province;
- target province;
- commander;
- number of Troops;
- amount of Food;
- optional Fifth Unit;
- required Gold for deployment.

A province can only directly attack neighbouring provinces.

---

### Campaign Logistics

An army requires Food to remain in the field; it consumes Food each day in proportion to its size (the daily formula is given under Supply, §6.9).

---

### Territory Conquest

When the attacker wins, the target province may transfer to the attacker’s house.

Province capture can also lead to:

- resource transfer;
- troop losses;
- commander capture;
- changes in border pressure;
- possible follow-up actions if the captured province can still activate later in the month.

Exact post-battle edge cases remain unresolved.

---

## 6.4 Army Composition

### Battlefield Army

During tactical battle, a strategic army is represented by up to five battlefield units:

```text
Horsemen
Knights
Knights
Archers
Fifth Unit
```

The commander is separate from these units.

---

### Standard Troop Distribution

Strategic Troops are automatically distributed across the four standard units:

```text
Horsemen
Knights
Knights
Archers
```

On entering battle, Troops are split roughly equally into Horsemen, Knights, Knights, and Archers, with the remainder going to Horsemen.

---

### Fifth Unit Slot

The fifth slot can be occupied by one special unit:

- Gem Guardian;
- Hired Fifth Unit;
- Pastha.

An army can have only one Fifth Unit at a time.

---

### Design Observation

The player does not customize the standard troop lineup.

Military variety comes from:

- commander choice;
- troop count;
- Food supply;
- Fifth Unit selection;
- terrain and battlefield layout;
- tactical positioning;
- strategic timing.

---

## 6.5 Standard Tactical Units

### Overview

The four standard tactical units are fixed: Horsemen, two Knights units, and Archers. Their Move, Range, and roles are canonical in Appendix C §C.1.

---

### Horsemen

Horsemen are the fastest standard unit.

They are useful for:

- flanking;
- rapid advances;
- flag pressure;
- finishing weakened units;
- exploiting openings.

---

### Knights

Knights are standard frontline melee units.

They are useful for:

- holding positions;
- blocking enemy movement;
- protecting the flag;
- building fences.

Both Knight units appear to be mechanically similar.

---

### Archers

Archers provide ranged support.

Known properties:

- Long-range attack;
- cannot attack adjacent cells;
- cannot attack diagonally;
- can attack without backlash / counter-damage.

Archers are tactically important because they can deal safer damage than melee units.

---

## 6.6 Fifth Unit System

### Overview

A Fifth Unit is a special unit that occupies the army’s fifth battlefield slot.

Fifth Units are the main source of asymmetry between armies.

They use Strength instead of normal troop count.

---

### Fifth Unit Categories

| Category         | Description                                             |
| ---------------- | ------------------------------------------------------- |
| Gem Guardian     | Magical unit tied to a Gem owned by a house.            |
| Hired Fifth Unit | Province-based special unit hired through Hire Monster. |
| Pastha           | Event-based special Fifth Unit.                         |

---

### Gem Guardians

Gem Guardians are tied to Gems. The seven confirmed Gem Guardians, with their Strength, Move, Range, and associated owners, are canonical in Appendix C §C.3.

Pastha is not a Gem Guardian. It is a special event-based Fifth Unit.

---

### Hired Fifth Units

Hired Fifth Units are obtained through the Hire Monster command.

The command name is misleading because the category includes both monsters and elite human units. The confirmed Hired Fifth Units, with their types and stats, are canonical in Appendix C §C.4.

---

### Strength

Fifth Units use Strength instead of ordinary troop count.

Strength represents the special unit’s combat power and durability.

Exact Strength loss rules differ by category and remain partially unresolved.

---

### Design Observation

Fifth Units are the military system’s main asymmetry lever.

Standard units are predictable and fixed. Fifth Units create meaningful differences between armies, houses, provinces, and scenarios.

---

## 6.7 Gem Guardians

### Strategic Role

Gem Guardians are powerful Fifth Units granted by house-level Gem ownership.

They are not hired locally and do not require upkeep.

A Gem Guardian can be used when:

- the house owns the associated Gem;
- the Gem is not on cooldown;
- the army has an available Fifth Unit slot.

---

### Known Rules

A Gem Guardian uses the Fifth Unit slot, requires no hiring cost or upkeep, and cannot permanently die. It is reusable but limited by a cooldown after use or defeat and weakens as it attacks; the exact cooldown and strength-loss rules are in the Gems chapter §7.

---

### Design Observation

Gem Guardians create strategic timing decisions.

Because Gems enter cooldown after use or defeat, the player must decide when a battle is important enough to commit a Gem Guardian.

---

## 6.8 Hired Fifth Units

### Strategic Role

Hired Fifth Units give a province access to special military power without requiring a Gem.

They are strong but risky assets.

---

### Known Rules

Hired Fifth Units come from the Hire Monster command, are province-based, can be destroyed, and can be moved through Move Troops / Transport. They carry a hiring cost, quarterly upkeep, and desertion risk. Their stats are canonical in Appendix C §C.4.

---

### Strategic Risk

Hired Fifth Units create ongoing obligations.

A house that hires many special units gains military flexibility, but also increases Gold pressure and exposure to desertion or harmful events.

---

## 6.9 Supply System

### Food Consumption

Food determines how long an army can remain in battle.

Food needed per day is (Troops + Hired Fifth Unit Strength) / 10 + 1.

Gem Guardians do not count toward this food requirement.

---

### Starvation

If an army runs out of Food, it can lose the battle regardless of remaining unit strength.

---

### Strategic Importance

Supply is one of the main constraints on aggression.

A strong army without enough Food may be unable to finish a battle, while a weaker defender can sometimes win by holding out long enough.

---

## 6.10 Post-Battle Resolution

### Victory Conditions

A tactical battle can be won through:

- capturing the enemy flag;
- destroying all enemy units;
- causing the enemy army to run out of Food;
- forcing or receiving enemy retreat;
- defending the flag long enough.

Exact victory conditions and battle timing remain partially unresolved.

---

### Territory Capture

If the attacker wins, the defending province may be captured.

If the defender wins, the province remains under its current owner.

---

### Commander Capture

After defeat, the losing commander may be captured.

Captured commanders enter the character interaction system:

- Recruit;
- Release;
- Banish.

Exact capture probability remains unresolved.

---

### Fifth Unit Outcome

Fifth Unit outcomes depend on category.

| Fifth Unit Type  | Defeat Outcome                                            |
| ---------------- | --------------------------------------------------------- |
| Gem Guardian     | Cannot permanently die; enters cooldown if defeated.      |
| Hired Fifth Unit | Can be destroyed; exact destruction threshold unresolved. |
| Pastha           | One-use event unit; disappears after use.                 |

---

## 6.11 Military Progression

### Overview

Gemfire does not use a technology tree for military advancement.

Military power grows through:

- more Troops;
- better commanders;
- stronger province economies;
- control of Gems;
- access to Hired Fifth Units;
- successful recruitment of enemy generals;
- better strategic positioning;
- better tactical play.

---

### Design Observation

Military progression is political and logistical rather than technological.

A house becomes stronger by gaining land, people, resources, Gems, and better positions on the map.

---

## 6.12 Military System Summary

### Reconstructed Military Model

```mermaid
flowchart TD
    Province --> Troops
    Province --> Food
    Province --> Gold
    Province --> HiredUnit["Hired Fifth Unit"]

    House["House / Family"] --> Gem
    Gem --> GemGuardian["Gem Guardian"]

    Commander --> Army

    Troops --> Horsemen
    Troops --> Knights1["Knights"]
    Troops --> Knights2["Knights"]
    Troops --> Archers

    HiredUnit --> FifthUnit["Fifth Unit"]
    GemGuardian --> FifthUnit
    Pastha --> FifthUnit

    FifthUnit --> Army
    Horsemen --> Army
    Knights1 --> Army
    Knights2 --> Army
    Archers --> Army

    Army --> TacticalBattle["Tactical Battle"]
    TacticalBattle --> ProvinceCapture["Province Capture"]
    TacticalBattle --> CommanderCapture["Commander Capture"]
```

---

---

## Detailed rules: War Costs and Free Movement

### Attack

```text
Gold cost   = troops ÷ 8 + 10
Food / day  = unit Strength ÷ 10 + troops ÷ 10 + 1
Days        = 3, 5, 8, or 10
Food taken  = Food / day × Days
```

- "Unit Strength" is the Strength of the accompanying hired Fifth Unit. A Gem Guardian adds nothing to food.
- Requires an adjacent, non-allied enemy province, at least 1 soldier, 10 Gold, and 1 Food.
- A Gem Guardian cannot be taken while its rest counter is above 0.
- The defender commits all its soldiers and food.
- Attack counts as a −1 command for policy events.
- The computer always takes 5 days.

### Move Troops

Free; ends the turn.

- Target must be adjacent and either owned or empty.
- May carry soldiers, one Fifth Unit (not a Gem Guardian), Gold, and Food, within the target's caps.
- Moving into an empty province claims it and raises the ruler's Fame by 3 (cap 100).

### Transport

Free; ends the turn.

- Sends or receives Gold and Food between any two owned provinces. **Adjacency is not required.**
- Needs at least two owned provinces.

---

---

## Detailed rules: Fifth Units After Battle

The unit taken into battle leaves its province slot. Afterwards it is put back only if it is an ordinary hireable unit with Strength above 0.

**A Pastha taken into battle is never put back, so it fights once.** (Likely — no other restore path was found.)

| Outcome       | Attacker's unit                                   | Defender's unit                                                                 |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Defender held | Returns to the origin province.                   | Stays in the province.                                                          |
| Attacker won  | Moves into the conquered province, still hired.   | Retreats with its owner if there is a province to retreat to; otherwise it joins the conquered province's hire pool. |

When a province is conquered, every other unit left in it joins that province's hire pool; a Pastha left there is removed.

When a province becomes unowned: Gold and Food halve, Soldiers and Loyalty drop to 0, hired units return to the hire pool, and a Pastha is removed.

If a side's Fifth Unit is destroyed in battle, that family's ruler loses 1 Fame and that side's commander loses 2–3 WAR (`maximum Strength ÷ 50`). ---

---

## Detailed rules: Generals After an Attack

### Who marches

The **whole leadership of the attacking province goes with the army**: its lord, or its ruler together with every court vassal. No one is left behind and no commander is chosen.

The origin province is without a general while the battle is fought. Nothing can exploit this, because the battle and its aftermath resolve before any other province acts.

### Outcomes

| Outcome | Attacker's generals | Defender's generals |
| --- | --- | --- |
| Attacker wins | Move into the conquered province and lead it. | Flee to a retreat province, unless the commander is captured. |
| Defender holds | Return to the origin province, unless the commander is captured. | Stay. |
| Defender fled before battle | As "attacker wins". | Go to the chosen province; the capture roll still applies. |
| Defender surrendered | As "attacker wins". | The commander is always captured. |

Capture chances are in [Tactical Battle](./09-tactical-battle-system.md#detailed-rules-tactical-battle); a prisoner's fate is in [Prisoners](./05-characters.md#detailed-rules-prisoners).

### Consequences of winning

- **The attacking leadership does not go home.** The origin province stays owned but is left without a general, under direct rule at half the ruler's stats.
- **A ruler who attacks and wins moves his home** to the conquered province, court included.
- The conquered province's Entrust setting is cleared. **The origin's is kept**: an entrusted province whose lord marched away and won stays entrusted, now under direct rule, and the computer keeps running it.

A family that attacks with every lord it has ends up with its generals at the front and its rear provinces under direct rule, until Change Lord sends someone back.

### Retreating inside a battle

A side that chooses Retreat during the battle picks its destination: an own or unowned neighbour of the battlefield, or the ruler's home. An attacker who retreats this way need not return to the province he came from.

### Where a fleeing defender lands

The retreat province is a random own or unowned neighbour of the battlefield; failing that, the ruler's home; failing that, there is nowhere to go and capture is certain.

| The retreat province… | Result |
| --- | --- |
| is unowned | It is claimed. The family's ruler gains 3 Fame. The fleeing leadership leads it. |
| is own, with no general | The fleeing leadership leads it. |
| is own, with a lord, and the one fleeing is the **ruler** | The ruler and his court take over. The lord joins the court as a vassal. Entrust is cleared. |
| is own, with a lord, and the one fleeing is a **lord** | The fleeing lord joins his ruler's court as a vassal, wherever the ruler is. |

### When the commander is captured

- **The court is not captured with a ruler.** Only the commander is the prisoner; the vassals' future follows from his fate.
- A captured lord who is ransomed or released rejoins his ruler's court **as a vassal**, even though he was a lord. The province he led keeps its owner and has no general.
- A captured ruler is never ransomed. He goes straight to Recruit, Release, or Banish.

**A released ruler** takes over a random province of his family other than the battlefield — not necessarily the one he left. Its lord, if any, joins his court. If the family has no other province he claims an unowned neighbour of the battlefield; if there is none the family is destroyed.

**A banished ruler** is succeeded by his heir, who becomes ruler where he stands, and the court gathers to him. With no heir the family splits.

An attacking ruler's family always still owns the province he set out from, so releasing him can never destroy the family. A defending ruler who loses his last province has no such safety.

---

---

## Summary

Gemfire’s military system connects local province resources, commanders, Fifth Units, and tactical battles.

The standard army structure is fixed:

```text
Horsemen
Knights
Knights
Archers
Fifth Unit
```

The player’s strategic military decisions are about:

- where to attack;
- which commander to use;
- how many Troops to commit;
- how much Food to allocate;
- whether to use a Gem Guardian;
- whether to hire or move a Hired Fifth Unit;
- how to manage post-battle risk.

The system is compact, but strategically rich because military strength depends on province economy, geography, characters, Gems, and supply.
