# 15. Events

**Status:** IMPLEMENTED

## Description

Province management attracts helpful visitors or harmful encounters. Seasonal disasters threaten particular regions, hired monsters may rampage, and Pastha rewards good rule with one battle of service. Illustrated reports introduce each province's turn before its orders begin.

## Glossary

| Term | Meaning |
| --- | --- |
| Goodwill | A province's hidden balance of beneficial and harmful orders during its current action cycle. |
| Action cycle | Three counted province orders, followed by one goodwill event check. Skipped turns and free orders do not advance it. |
| Incident | One goodwill encounter, disaster, or rampage and its consequences for a province. |
| Goodwill event | A helpful or harmful encounter whose likelihood depends on the completed action cycle. A check can also produce no encounter. |
| Disaster | A seasonal threat determined by geography and month, independently of goodwill. |
| Rampage | Damage caused by a stationed hired monster, independently of goodwill. Mercenaries, Gem Guardians, and Pastha do not rampage. |
| Event report | An account of an incident, naming its date, province, and participants. |
| Pastha | A water dragon stationed in a province, available for one battle as its army's Fifth Unit. Each offer grants a separate visit. |

## Functionality

- Count completed orders using the [established goodwill values](../spec/appendix-d-rules-data.md#d5-goodwill-rules). After the third counted order, the province is due one check at the next month's opening. Reset its cycle after that check, including when nothing happens.
- At month opening, finish deaths and succession first. Resolve disasters, rampages, and due goodwill checks before September income and ordinary turns. Keep reports for each province's turn opening, before player or computer orders. An ended campaign receives no further incidents.
- Apply the same rules to player, entrusted, and rival provinces. Unowned provinces have no event checks. A change of owning house clears the province's unfinished or pending cycle; changing its lord or entrusting it does not.
- A goodwill check produces at most one encounter. Disasters and rampages are independent and may affect that province in the same month. An incident does not count as an order or generate another goodwill check.
- Apply event effects within the existing stat limits. Character rewards go to the province's current lord, including the family ruler when ruling remotely; they improve the character's full abilities.
- Resolve each incident completely before the next. Stat limits and mitigation apply before recording the outcome.

### Event selection

Use the encounters and effects in the [event catalogue](../spec/11-events.md#114-good-events), and the [regional disaster schedule](../spec/11-events.md#116-seasonal-and-natural-disasters).

Positive goodwill favours good encounters, negative goodwill favours bad ones, and stronger positive goodwill makes exceptional rewards such as Pastha more likely. A completed cycle can produce no event. Exclude encounters with no eligible recipient or possible effect; do not keep rolling until something happens.

Protection reduces both the likelihood of harmful goodwill encounters and the damage from harmful incidents. It does not increase good-event chances or remove seasonal and monster risks. Use the province's Protection before each incident to determine all of that incident's losses.

Check each scheduled disaster independently for every eligible owned province. A regional disaster and plague may both strike the same province. Check rampage risk monthly in provinces with hired monsters, even when they have skipped orders or accumulated positive goodwill. At most one monster rampages per province that month; it remains in service afterward.

### Pastha's service

- Pastha is free, needs no upkeep or food, and neither deserts nor rampages. Several visits can be held, but an army still selects only one Fifth Unit.
- It may move to an adjacent friendly or unowned province with Move Troops. Unused visits remain available without a time limit; peaceful house absorption transfers them with their province. Visits left in a province taken by force depart.
- Use the [recorded combat characteristics](../spec/appendix-c-military-data.md#c5-pastha). Pastha shares the Guardians' attack fatigue and can fight without ordinary troops.
- A visit is spent when its Pastha participates in an actual battle, whether fought manually or automatically, won, lost, or abandoned by retreat. Selecting it and cancelling, or taking a province without a battle, does not spend it. An unspent attacking Pastha accompanies a successful occupation.

### The death banshee

A ruler's death of old age sounds a banshee's wail, including a rival ruler's death and an heirless death that ends the campaign. It accompanies the death report once and replaces that report's ordinary death bell. It is separate from the harmful banshee encounter, causes no stat loss, and does not sound for banishment or a non-ruler's death.

## Use cases

- **A skipped month:** A province develops twice, skips its next turn, then develops again. Its cycle completes on that third development; the following month can bring a reward. Skipping has neither reset the cycle nor supplied the missing action.
- **A change of owner:** A province completes three harmful orders, then is conquered before the next month. The new owner starts a fresh cycle. Seasonal disaster and monster risks still apply.
- **Two incidents in one province:** A June flood damages a wetland province, then its due goodwill check brings Far Gorta. The food gift does not undo the damaged development; each encounter receives its own report.
- **Protecting a monster's province:** A well-managed province still suffers a rampage. Its Protection reduces the damage, and the report identifies the stationed monster responsible.
- **Saving Pastha for a battle:** The player selects Pastha for an invasion whose defender concedes. Pastha remains available in the occupied province. It leaves after participating in a later battle, even if the player retreats immediately.

## UI

```text
┌────────────────────────────────────────────┐
│  <Province> — Pastha offers aid            │
│  <House> · <Month Year>                    │
├────────────────────────────────────────────┤
│                                            │
│                       /\   /\              │
│                  /\__/  \_/  \             │
│            _____/             \            │
│       ____/      (o)    /\     \           │
│      /  _    __________/  \    |           │
│     /__/ \__/              |   |           │
│           \_/              |   |           │
│                           /   /            │
│                          /   /             │
│                  _______/   /              │
│         ________/          /___            │
│     ~~~/_______________________\~~~        │
│   ~~~~~    ~~~~~~    ~~~~~~    ~~~~~       │
│      ~~~~~~    ~~~~~~    ~~~~~~            │
│                                            │
│  Pastha has offered to fight for you.      │
│                                            │
│  Fifth Unit: Pastha joins this province    │
│  Available for one battle. No upkeep.      │
│                                            │
│                           [ Continue ]     │
└────────────────────────────────────────────┘
```

At each province's turn opening, show its incident reports before orders begin. Show all incidents in the player's provinces, including entrusted ones; show only disasters in other houses' provinces. Put the province and event in the heading, with its owning house and date beneath. Describe what happened without numerical stat changes; character rewards name the recipient. The left panel and map follow the report's province, then return to the active turn after the reports close.

A province's reports wait for acknowledgment one at a time, in resolution order: regional disaster, plague, rampage, then goodwill encounter. Orders wait until those reports close; acknowledging them never applies effects again. Other provinces' reports wait for their own turns. Omit queue counts and unsuccessful checks.

The province's Fifth Unit roster and battle selection show each available Pastha visit and its single-battle service. Goodwill, action counts, and random chances remain hidden.

## Research

### When should a completed cycle resolve?

Resolving immediately after the third order gives quick feedback, but the [specification's example](../spec/11-events.md#112-province-action-count) places three January–March actions before an April check. [Hartman's guide, section VI](../guides/Guide_by_Hartman.txt), also places encounters between months. Resolve due cycles at the following month opening. This lets attacks and their aftermath finish before an unrelated encounter.

Keeping a cycle through conquest would make the conqueror inherit the previous house's moral account. Clear it on ownership changes, while retaining it through changes of lord within the same house. Resolve succession first so rewards cannot target a deceased lord, and resolve disasters before income so damaged Cultivation affects that September's harvest.

### How frequent and disruptive should incidents be?

The [original probabilities, thresholds, and damage formulas are unknown](../spec/11-events.md#open-questions). They remain balance questions. Playtesting must establish whether management measurably changes outcomes, Protection makes recovery easier, and incidents leave room for ordinary development as a house grows.

### Does good management prevent a rampage?

Hartman's section VI explicitly separates rampages and natural disasters from goodwill. Treat rampages as an independent monthly risk, so skipping orders cannot make hired monsters harmless. The FAQ reports more rampages from Orks and Olog-Hai but supplies no reliable rates. Use one province-level risk rather than multiplying it for every reserve unit; species-specific rates remain unconfirmed. Upkeep and mercenary desertion retain their [existing rules](./06-fifth-units.md).

### When is Pastha spent, and can offers accumulate?

The [FAQ's Pastha entry](../guides/Gemfire_FAQ_v2.1.txt) describes accumulating visits and losing them after one battle; the [manual](../guides/Gemfire_Game_Manual_recognized_final.md#pastha) describes departure after service. Consuming a visit on selection would waste it on cancelled or conceded invasions. Spend only the participating visit after an actual battle, and keep other visits available. Provincial availability and movement follow stationed Fifth Units; Pastha's free service and departure distinguish it from hired units.

## Domain model

```mermaid
classDiagram
  class Province
  class Cycle["Action cycle"] {
    counted orders
    accumulated goodwill
    due next month
  }
  class Incident["Incident"]
  class Encounter["Goodwill event"]
  class Disaster
  class Rampage
  class Monster["Hired monster"]
  class Lord
  class Report["Event report"]
  class Pastha["Pastha visit"]
  class Battle

  Province "1" *-- "0..1" Cycle : owned province accumulates
  Cycle --> Encounter : may produce
  Incident <|-- Encounter
  Incident <|-- Disaster
  Incident <|-- Rampage
  Incident "0..*" --> "1" Province : affects
  Incident "1" --> "1" Report : explained by
  Encounter --> Lord : may improve abilities
  Encounter --> Pastha : may grant
  Province "1" o-- "0..*" Monster : stations
  Rampage --> Monster : caused by
  Province "1" o-- "0..*" Pastha : hosts
  Pastha "0..2" --> "0..1" Battle : spent after participation
```

## Flow

```mermaid
sequenceDiagram
  participant Campaign
  participant Provinces
  participant Player

  Campaign->>Campaign: Open month and resolve deaths and succession
  opt A ruler died of old age
    Campaign-->>Player: Death report with banshee wail
  end
  alt Campaign ended
    Campaign-->>Player: Show ending
  else Campaign continues
    Campaign->>Provinces: Resolve seasonal disasters, then monster rampages
    Campaign->>Provinces: Check completed action cycles, then reset them
    Provinces-->>Campaign: Actual incident effects and reports
    Campaign->>Provinces: Collect income when due
    loop Each province turn while campaign continues
      Campaign->>Provinces: Begin the province's turn
      loop Each report visible to the player for this province
        Campaign-->>Player: Show illustration and describe the incident
        Player->>Campaign: Acknowledge
      end
      Provinces->>Provinces: Complete player or computer orders and their consequences
      opt A counted order completes an action cycle
        Provinces->>Provinces: Due a goodwill check next month
      end
    end
  end
```

## Persistence

When saving arrives, retain each province's partial or pending action cycle, unused Pastha visits, and reports still awaiting their province's turn or acknowledgment. Resuming during an announcement must show the remaining reports without applying damage, granting rewards, or checking that month again.

## Tests

- **Cycle timing:** Two counted orders followed by a skipped turn remain incomplete. The third makes exactly one check due next month; free orders, failed validation, and announcements cannot advance it. A no-event result also clears the cycle.
- **Ownership:** Conquest and absorption clear prior goodwill and a pending check. Reassigning a lord or entrusting the province preserves both. Unowned land gets no incidents.
- **Outcome selection:** Controlled chance boundaries distinguish good, bad, and no event. Stronger goodwill favours stronger rewards; unavailable effects are excluded without repeated rolls until success.
- **Effects:** Every encounter changes its specified target only. Remote rule improves the ruler's full abilities. Stat limits bound gains and losses; zero-effect candidates are excluded.
- **Protection:** Higher Protection reduces bad-encounter risk and incident damage without eliminating disaster risk. Damage to Protection does not change that incident's other losses, but affects subsequent incidents. Preventing a bad encounter does not turn it into a good one.
- **Disasters:** Region boundaries and months exclude ineligible provinces. Plague remains possible outside regional disaster zones; a province can receive both incidents. September damage precedes harvest.
- **Rampage:** Positive goodwill and skipped turns do not prevent it. The named culprit must be a stationed monster; it remains in service afterward. Several monsters cannot produce multiple rampages in the same monthly check.
- **Pastha:** Offers accumulate independently and can move between provinces. Cancelling or winning without battle preserves the selected visit; every actual battle outcome spends it exactly once, including automatic combat and retreat. Other visits remain available, with no upkeep, food cost, or desertion.
- **Reports and finality:** The player's incident reports and other houses' disaster reports appear only at the affected province's turn opening, before orders. Other enemy incidents stay silent. The left panel and map follow the displayed report and return to the active province afterward. Acknowledgment never repeats effects. An heirless death ending the campaign prevents subsequent incidents and income.
- **Death banshee:** Each old-age ruler death sounds once alongside its report, including rivals and the final defeat. Ordinary deaths, banishment, and the stat-damaging banshee encounter do not trigger that death cue.
