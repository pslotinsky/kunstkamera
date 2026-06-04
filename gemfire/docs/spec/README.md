# Gemfire Reconstruction Spec

A reverse-engineering specification for **Koei's Gemfire** — a complete-enough reconstruction of the original game's structure, mechanics, and data to implement a faithful remake or engine.

**Scope:** it documents the *original* Gemfire (Ishmeria, provinces, economy, characters, warfare, Gems, diplomacy, events, scenarios, and AI) rather than proposing new design.

Chapters (01–13) explain how each system works; appendices (A–E) hold the large shared data tables.

---

## Documents

| File | Description |
| --- | --- |
| [01-high-concept.md](./01-high-concept.md) | Core game structure, campaign goal, core loop, and major systems. |
| [02-world-model.md](./02-world-model.md) | Ishmeria, provinces, houses, ownership, and strategic map structure. |
| [03-turn-structure.md](./03-turn-structure.md) | Monthly cycle, province actions, activation order, and end-of-month processing. |
| [04-economy-system.md](./04-economy-system.md) | Gold, Food, Troops, Loyalty, Cultivation, Protection, Trade, Develop, Give Food, and Recruit. |
| [05-characters.md](./05-characters.md) | Generals, rulers, vassals, WAR/INT/CHA, Fame, hidden loyalty, capture, and recruitment. |
| [06-military-system.md](./06-military-system.md) | Strategic warfare: troops, commanders, supply, invasion, conquest, and the Fifth Unit slot. |
| [07-gem-system.md](./07-gem-system.md) | Gems as house-level assets: Gem Guardians, cooldown, transfer, and strategic role. |
| [08-monsters.md](./08-monsters.md) | Hired Fifth Units: monsters, mercenaries, upkeep, desertion, movement, and risk. |
| [09-tactical-battle-system.md](./09-tactical-battle-system.md) | Tactical battle: 10×8 grid, units, flags, food timer, facing, fences, and victory conditions. |
| [10-diplomacy.md](./10-diplomacy.md) | Ally, Defection, Surrender, Sabotage, Plunder, and the role of Fame. |
| [11-events.md](./11-events.md) | Good and bad events, goodwill, action count, disasters, Pastha, and hired-unit events. |
| [12-scenarios.md](./12-scenarios.md) | The four scenarios as time slices of the same war for Ishmeria. |
| [13-ai-specification.md](./13-ai-specification.md) | Observed AI behaviour: Entrust, strategic AI, tactical AI, diplomacy, and auto-control. |

## Appendices

| File | Description |
| --- | --- |
| [appendix-a-world-data.md](./appendix-a-world-data.md) | Province list and numbers, adjacency, geography, strategic and disaster regions, active families, and house-level notes. |
| [appendix-b-character-and-scenario-data.md](./appendix-b-character-and-scenario-data.md) | Generals, rulers, vassals, the character stat format, scenario province ownership, starting Gems and rosters, and scenario data gaps. |
| [appendix-c-military-data.md](./appendix-c-military-data.md) | Standard units, Gem Guardians, Hired Fifth Units, Pastha; Strength / Move / Range / Cost tables, movement traits, and range patterns. |
| [appendix-d-rules-data.md](./appendix-d-rules-data.md) | Command categories and tables, monthly action rules, goodwill values, the unknown-formula register, and the data-confidence legend. |
| [appendix-e-lore-and-narrative-data.md](./appendix-e-lore-and-narrative-data.md) | Story premise, the Gemfire ↔ Royal Blood name mapping, mythic framing, key characters (Eselred, Robyn), the Gem scattering, the scenario narrative timeline, and known narrative limits. |

---

## Research Sources

| Source                                                                                                                                               | Used for                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [GameFAQs — TIDQ Strategy Guide](https://gamefaqs.gamespot.com/snes/588352-gemfire/faqs/34164)                                                       | Main mechanics reference: commands, economy, diplomacy, battle rules, events, Gems, and Fifth Units. |
| [GameFAQs — DragonAtma General Stats](https://gamefaqs.gamespot.com/snes/588352-gemfire/faqs/50679)                                                  | General list, stats, birth years, scenario service, and province assignments.                        |
| [Andrew Que's Gemfire Complete Guide](https://gemfire.drque.net/)                                                                                    | Structured data reference for provinces, families, scenarios, land connections, and Fifth Units.     |
| [Andrew Que — Lands](https://gemfire.drque.net/Lands.php)                                                                                            | Province adjacency and land connection data.                                                         |
| [Andrew Que — Families](https://gemfire.drque.net/Families.php)                                                                                      | Active families and house-level data.                                                                |
| [Andrew Que — Fifth Units](https://gemfire.drque.net/5thUnits.php)                                                                                   | Hired Fifth Unit and Gem Guardian stats.                                                             |
| [Andrew Que — Erin & Ander](https://gemfire.drque.net/ErinAndAnder.php)                                                                              | Scenario 1 data.                                                                                     |
| [Andrew Que — Flax's Shame](https://gemfire.drque.net/FlaxsShame.php)                                                                                | Scenario 2 data.                                                                                     |
| [Andrew Que — Terian's War](https://gemfire.drque.net/TeriansWar.php)                                                                                | Scenario 3 data.                                                                                     |
| [Andrew Que — Gemfire Scenario](https://gemfire.drque.net/GemfireScenario.php)                                                                       | Scenario 4 data.                                                                                     |
| [SNES Manual](https://www.videogamemanual.com/snes/Gemfire%20%28USA%29.pdf)                                                                          | Official terminology, command descriptions, and basic rules.                                         |
| [Genesis Manual](https://segaretro.org/images/a/a9/Gemfire_MD_US_Manual.pdf)                                                                         | Cross-version terminology and scenario/rule checks.                                                  |
| [GameFAQs Boards](https://gamefaqs.gamespot.com/boards/588352-gemfire)                                                                               | Player-tested formulas, hidden mechanics, event research, and AI observations.                       |
| [Koei Tecmo Wiki — Gemfire](https://koeitecmo.wiki/wiki/Gemfire)                                                                                     | High-level scenario and lore cross-checks.                                                           |
| [Koei Tecmo Wiki — Generals](https://koeitecmo.wiki/wiki/Gemfire/Generals)                                                                           | Character stat format and general reference data.                                                    |
| [Printed Ishmeria Map](https://archive.nes.science/nintendoage-forums/nintendoagemedia.com/elements_nocache/121C5AB1-FB40-7B7A-CB2DD691201C243A.jpg) | Province names, numbering, and visual geography.                                                     |
| [Spriters Resource Asset Sheet](https://www.spriters-resource.com/media/assets/26/28479.png?updated=1755472620)                                      | Sprite, UI, unit, and visual reference.                                                              |

### Source notes

Official manuals are preferred for player-facing terminology and basic rules. GameFAQs guides and Andrew Que's Complete Guide are the main gameplay and data references. Forum posts and fan-tested formulas are useful but should be marked uncertain unless confirmed elsewhere. Unverified mechanics are flagged directly in the relevant document.

Working copies of the main sources are kept in the repository: the TIDQ FAQ, the admtanaka guide, and recognized manual text in `gemfire/docs/guides/`, and the scenario ROM data (`SNDATA1–4`) in `gemfire/data/`. The scenario ROM data is the authority for province ownership, starting stats, and hire pools; the General Stats roster provides all 64 generals' attributes.
