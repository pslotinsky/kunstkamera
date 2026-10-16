# Prototype

**Status:** DRAFT

## Goal

Validate the core strategic loop before investing in the broader game.

The prototype must show whether development, fleet positioning, travel time, combat, AI, recruitment, and multi-turn conquest create interesting decisions together.

## Included Systems

- [turns.md](../systems/turns.md)
- [galaxy.md](../systems/galaxy.md)
- [planets.md](../systems/planets.md)
- [economy.md](../systems/economy.md)
- [buildings.md](../systems/buildings.md)
- [recruitment.md](../systems/recruitment.md)
- [fleets.md](../systems/fleets.md)
- [movement.md](../systems/movement.md)
- [fleet-combat.md](../systems/fleet-combat.md)
- [planetary-assault.md](../systems/planetary-assault.md)
- [information-and-exploration.md](../systems/information-and-exploration.md)
- [diplomacy.md](../systems/diplomacy.md) (prototype hostility rule only)
- [ai.md](../systems/ai.md)

Colonization is outside the prototype. Every planet starts owned by either a playable faction or a neutral faction.

All other systems in [overview.md](../overview.md) are outside the prototype unless explicitly added later.

## Prototype Assumptions

- four mechanically symmetric playable factions;
- neutral non-playable factions own the remaining planets;
- identical available content for playable factions;
- AI is part of the prototype and follows the same information rules as players;
- Heroes are not implemented; see [characters.md](../systems/characters.md);
- the prototype victory and defeat rules in [victory.md](../systems/victory.md) apply.

## Fidelity

- minimal content set;
- placeholder visuals;
- debug or temporary UI;
- no requirement for faction asymmetry;
- no production-quality art, audio, onboarding, or UX polish.

## Exit Criteria

Play must demonstrate that:

- location, Route distance, and Fleet speed affect military decisions;
- planet growth is constrained by Food while buildings compete for limited slots;
- economic development, replenishment, recruitment, and fleet upkeep compete for the same treasury;
- new fleets can be formed through planet recruitment without an intermediate unit-storage state;
- recruitment creates a meaningful temporary mobility commitment;
- Fleet capacity constrains Army growth without a separate system-wide recruitment limit;
- fleet composition or commitment affects battle outcomes;
- using a fleet on one objective creates opportunity cost elsewhere;
- planetary assault creates a meaningful defender response window;
- travel time can change the outcome of territorial warfare;
- acquiring territory changes future strategic options;
- AI can develop, replenish and recruit fleets, move, fight, and attempt conquest using only available information.

## Campaign UI Reference

The campaign interaction notes are documented in [Campaign UI Mockups](../../mockups/campaign/README.md). Gameplay rules remain in the system documents listed above.
