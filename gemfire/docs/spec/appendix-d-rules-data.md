# Appendix D — Rules Data

## Purpose

Appendix D is the canonical data layer for Gemfire's commands and command-level mechanics.

This appendix covers:

- command categories;
- the strategic and tactical command tables;
- monthly action rules;
- goodwill values;
- the unknown-formula register;
- the data confidence legend.

---

# D.1 Command Categories

## Overview

Commands in Gemfire can be grouped by function.

| Category           | Commands                                               |
| ------------------ | ------------------------------------------------------ |
| Domestic / Economy | Develop, Give Food, Trade                              |
| Military           | Recruit, Attack, Transport / Move Troops, Hire Monster |
| Diplomacy          | Ally, Defection, Surrender, Sabotage, Plunder          |
| Administration     | View / Enquiry, Change Lord, Entrust                   |
| Search / Artifacts | Search                                                 |
| Tactical Battle    | Move, Attack, Fence, Break, Wait, Retreat, Auto        |

---

## Core Rule

Most important strategic commands consume the monthly action of a province.

This makes every command choice a tradeoff:

```text
Develop
or
Recruit
or
Attack
or
Diplomacy
or
Transport
or
Search
```

---

# D.2 Strategic Command Table

## Province Commands

| Command              | Category       | Consumes Monthly Action           | Primary Effect                          |
| -------------------- | -------------- | --------------------------------- | --------------------------------------- |
| Develop: Cultivation | Economy        | Yes                               | Raises Cultivation.                     |
| Develop: Protection  | Economy        | Yes                               | Raises Protection.                      |
| Give Food            | Economy        | Yes                               | Raises province Loyalty.                |
| Trade: Buy Food      | Economy        | No                                | Converts Gold to Food.                  |
| Trade: Sell Food     | Economy        | No                                | Converts Food to Gold.                  |
| Recruit              | Military       | Yes                               | Raises Troops.                          |
| Attack               | Military       | Yes                               | Invades adjacent province.              |
| Transport / Move     | Logistics      | Yes                               | Moves resources / troops.               |
| Hire Monster         | Military       | Usually yes / needs version check | Hires local Fifth Unit.                 |
| Dismiss Fifth Unit   | Military       | Needs verification                | Removes Hired Fifth Unit.               |
| Ally                 | Diplomacy      | Yes                               | Creates alliance.                       |
| Break Alliance       | Diplomacy      | Yes                               | Ends alliance.                          |
| Defection            | Diplomacy      | Yes                               | Attempts to convert enemy vassal.       |
| Surrender            | Diplomacy      | Yes                               | Attempts to absorb enemy family.        |
| Sabotage             | Diplomacy      | Yes                               | Damages enemy province or reputation.   |
| Plunder              | Diplomacy      | Yes                               | Steals Gold / Food.                     |
| Search               | Search         | Yes                               | Finds artifacts / inspects Fifth Units. |
| View / Enquiry       | Administration | No                                | Inspects data.                          |
| Change Lord          | Administration | N/A / uncertain                   | Assigns lord.                           |
| Entrust              | Administration | N/A / setup command               | Delegates province to AI.               |

---

## Notes

Some commands have unclear action-cost behaviour across versions.

When uncertain, the command should be marked as:

```text
Needs verification
```

---

# D.3 Tactical Battle Command Table

## Unit-Level Commands

| Command | Available To            | Effect                     |
| ------- | ----------------------- | -------------------------- |
| Move    | All battle units        | Move unit across the grid. |
| Attack  | Units with valid target | Attack enemy unit.         |
| Fence   | Knights only            | Build fence obstacle.      |
| Break   | All units               | Attempt to destroy fence.  |
| Wait    | All units               | End unit action.           |

---

## Army-Level Commands

| Command | Effect                              |
| ------- | ----------------------------------- |
| Retreat | Attempt to withdraw from battle.    |
| Auto    | Let AI control the tactical battle. |

---

## Battle Command Flow

A battle unit generally follows this activation structure:

```text
Select Unit
↓
Move
↓
Action
```

Actions include:

```text
Attack
Fence
Break
Wait
```

---

# D.4 Monthly Action Rules

## Core Rule

Each province usually performs one significant action per month.

This action may be:

- economic;
- military;
- diplomatic;
- logistical;
- search-related.

---

## Turn-Consuming Actions

Confirmed or strongly supported turn-consuming actions include:

| Action           | Notes                                          |
| ---------------- | ---------------------------------------------- |
| Develop          | Cultivation / Protection.                      |
| Give Food        | Raises Loyalty.                                |
| Recruit          | Raises Troops.                                 |
| Attack           | Invades adjacent province.                     |
| Transport / Move | Moves resources / troops.                      |
| Diplomacy        | Ally, Defection, Surrender, Sabotage, Plunder. |
| Search           | Artifact / Fifth Unit intelligence.            |
| Hire Monster     | Likely consumes action; verify by version.     |

---

## Non-Turn-Consuming Actions

| Action                    | Notes                                        |
| ------------------------- | -------------------------------------------- |
| Trade                     | Buy / Sell Food; does not end province turn. |
| View / Enquiry            | Information only.                            |
| Some administrative views | Interface only.                              |

---

## Rule Implication

Trade being free is important.

It allows the player to correct resource imbalances before spending the province’s monthly action.

---

# D.5 Goodwill Rules

## Goodwill Values

Each turn-based province command applies the following goodwill modifier; this table is the canonical home for those per-command values.

| Command              | Goodwill |
| -------------------- | -------: |
| Attack               |       -1 |
| Recruit              |       -1 |
| Move / Transport     |        0 |
| Hire Monster         |        0 |
| Develop: Cultivation |       +1 |
| Develop: Protection  |       +1 |
| Buy / Sell           |      N/A |
| Give Food            |       +1 |
| Ally                 |       +1 |
| Break Alliance       |        0 |
| Defection            |        0 |
| Surrender            |        0 |
| Sabotage             |       -1 |
| Plunder              |       -1 |
| Enquiry / View       |      N/A |
| Rule / Change Lord   |  N/A / 0 |
| Entrust              |      N/A |
| Search               |        0 |

---

# D.6 Unknown Formula Register

The following formulas remain unresolved:

1. Exact tax formula.
2. Exact harvest formula and whether Protection always contributes.
3. Exact market rate timing.
4. Exact Defection formula.
5. Exact Surrender formula.
6. Exact Alliance success formula.
7. Exact General Loyalty scale.
8. Exact battle damage formula.
9. Exact WAR contribution to combat.
10. Exact flank / rear numeric modifiers.
11. Exact fence build / break formula.
12. Exact terrain modifiers.
13. Exact Protection mitigation formula.
14. Exact Hired Fifth Unit destruction threshold.
15. Exact rampage / loss-of-faith formula.
16. Exact Search success formula.
17. Exact AI attack decision formula.
18. Exact auto-combat formula.
19. Exact Entrust AI priority order.
20. Resolved — range tile diagrams (Short / Long / Circular / Largest) are in Appendix C §C.6; "Outer" is not a distinct range.

---

# D.7 Data Confidence Notes

## Confidence Levels

| Level       | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| High        | Confirmed by manual, FAQ, or repeated source agreement. |
| Medium-High | Strongly supported by player research and examples.     |
| Medium      | Plausible reconstructed formula or partially verified.  |
| Low         | Mentioned but not well verified.                        |
| Unknown     | No reliable formula or rule found.                      |

---

## Documentation Rule

When a rule is uncertain, it should be marked as:

```text
Needs verification
```

or assigned confidence:

```text
Medium
Low
Unknown
```

instead of being presented as confirmed.

---

# Summary

Appendix D is the canonical data layer for Gemfire's commands.

It holds:

- the command categories and the strategic / tactical command tables;
- the monthly action rules;
- the per-command goodwill values;
- the unknown-formula register;
- the data confidence legend.

Detailed mechanics and formulas live inline in their owning chapters; this appendix carries only the command-level data and the registers above.
