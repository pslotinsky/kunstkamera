# Gemfire — Roadmap

Features and their steps are listed in build order: top to bottom is what to do next, and each item assumes the ones above it exist.

## Groundwork

Reverse-engineering and the spec under `docs/spec/` — shared groundwork the remake builds on.

- [ ] fill scenario data gaps → appendix-b
- [ ] resolve unknown-formula register → appendix-d

## 1. Global map

The strategic screen you act from: provinces, ownership, details, and the orders launched from each.

- [x] see the full map of Ishmeria
- [x] see who owns each province
- [x] inspect a province's details
- [x] see the orders available for a province you control

## 2. The monthly turn

The loop that drives play: issue every province's orders, then let time pass.

- [x] issue your provinces' orders for the month
- [x] advance to the next month once orders are set
- [x] collect the annual tax and harvest as the year turns

## 3. Province economy

The Domestic orders that grow a province month over month.

- [x] develop a province and cultivate its fields
- [x] build protection against attack and disaster
- [x] give food to raise loyalty (every order carries goodwill)
- [x] trade food at a market rate that swings month to month
- [x] transport gold and food to any province you own

## 4. Generals & lords

Who runs your provinces: viewing and assigning the family's members.

- [x] view a general's stats and fame
- [x] appoint or change a province's lord, or rule it directly
- [ ] ~~move your home province~~ — cancelled

## 5. Armies & movement

Raising and moving troops — bloodless expansion before any battle.

- [x] recruit troops with gold
- [x] move troops and food into a neighboring province
- [x] claim a neutral province by moving into it

## 6. Fifth Units

The hiring economy for the allies that will fill an army's fifth slot — defined and acquired before the battles that use them.

- [x] hire a monster or elite mercenary into the fifth slot
- [x] pay quarterly upkeep, or watch hired units desert
- [x] dismiss a hired Fifth Unit
- [ ] carry a hired Fifth Unit to a neighbor with your troops
- [ ] see a province's hired Fifth Units
- [ ] watch hired units lose faith and desert

## 7. Search & treasure

What spying into a province turns up, and the scouting that readies an attack.

- [ ] search a province for artifacts and gems
- [ ] scout a rival province before attacking
- [ ] spy on a rival province's Fifth Unit
- [ ] equip artifacts to boost a general

## 8. Gems

Gems as family-level assets — finding, claiming, and holding them; the path to Crown Gemfire. Their Guardians fight in Battle.

- [ ] find and claim gems
- [ ] hold several gems at once

## 9. Battle

The whole tactical layer, built once — and last in the war chain, so it consumes every combatant already defined: generals' troops, hired Fifth Units, and Gem Guardians, with the enemy run by a tactical AI.

- [ ] attack an adjacent rival province, choosing a commander and committing troops and food
- [ ] when your land is attacked, choose to fight, retreat, or surrender
- [ ] fight on a 10×8 field of plains, woods, rivers, boulders, bridges, and walls
- [ ] maneuver by position and facing; strike from front, flank, or rear
- [ ] build and break fences (flying units ignore them)
- [ ] field a Fifth Unit and summon a Gem's Guardian, resting or cooling them between battles
- [ ] face an enemy army run by a tactical AI, or auto-resolve the fight
- [ ] win by flag, food timer, or rout — across the sunrise-to-midnight day cycle
- [ ] retreat from a losing battle, risking capture

## 10. Conquest & captives

The immediate fruits of a won battle.

- [ ] claim gold, food, and land as war spoils
- [ ] knock a rival family out of the game
- [ ] ransom, recruit, release, or banish a captured leader
- [ ] buy a captured ruler's freedom

## 11. Diplomacy

The Diplomacy orders: alliance, defection, sabotage, plunder, and surrender.

- [ ] propose and break alliances
- [ ] make enemy generals defect
- [ ] sabotage and plunder rival provinces
- [ ] accept a family's surrender

## 12. Character lifecycle

Generals age, grow, and die; a fallen ruler's family passes to an heir.

- [ ] watch a general's stats rise, then decline with age
- [ ] lose generals and rulers to death of old age
- [ ] pass a fallen ruler's family to an heir
- [ ] see a heirless family disband — its gems and lands scatter

## 13. Strategic AI

Rival families that take their own monthly turns, plus handing your own work to the computer. (Tactical AI lives with Battle.)

- [ ] face rival families that act on their own
- [ ] entrust a province to its lord, freeing you from its orders

## 14. Victory & defeat

How the campaign ends.

- [ ] win by unifying Ishmeria
- [ ] be knocked out when your last province falls
- [ ] see the campaign's ending

## 15. Events

Good and bad events, seasonal disasters, and Pastha.

- [ ] hit random good and bad events
- [ ] suffer seasonal disasters by region (snow, fire, flood, quake, plague)
- [ ] trigger special events like Pastha
- [ ] hear the banshee when a ruler dies
- [ ] be told when a hired unit deserts (unpaid upkeep or low fame)
- [ ] suffer a hired unit's rampage (loyalty, cultivation, and protection drop)

## 16. New game & advisors

Starting a campaign: title screen, scenario and family choice, and an advisor to consult.

- [ ] start a new game from the title screen
- [ ] pick one of the four scenarios
- [ ] choose the family you play
- [ ] pick one of four advisors at setup
- [ ] get advice on your next move during play

## 17. Save / load

Persistence of game state between sessions.

- [ ] save a game in progress
- [ ] load and resume a saved game

## 18. Options / settings

Game settings and session control.

- [ ] set the message speed
- [ ] toggle battle animation
- [ ] toggle sound
- [ ] quit, or hand the game to the computer to finish

## 19. Audio

Music and sound effects across the game.

- [ ] hear music across menus, map, and battle
- [ ] hear sound effects for actions and combat

## 20. Multiplayer

Hot-seat play: multiple human players sharing one game.

- [ ] hand a family to another human player
- [ ] take turns hot-seat, swapping control each turn
- [ ] drop a player and let the computer take over
