# Battle UI Mockups

**Reference:** approved battle-concept mockup v9.

**Interactive artifact:** [Open the battle prototype](./prototype.html). Its page title says v3, and its source includes the v9 refinements.

This directory documents the current visual exploration of fleet-combat interaction models. It is a design reference, not a replacement for the canonical combat rules in [fleet-combat.md](../../game/systems/fleet-combat.md).

The prototype lets readers try the interaction models described below.

## Concepts

1. **Autoresolve** — result and losses only.
2. **Autoresolve + playback** — the result is predetermined; the battle is only replayed visually.
3. **Semi-automatic battle** — the player deploys forces, then observes the battle. The mockup compares four spatial models:
   - formation without a navigable battlefield;
   - depth columns / echelons;
   - a Darkest Dungeon-like positional row;
   - initiative order with large one-versus-one engagements.
4. **Semi-automatic + decisions** — the same underlying battle models, with a player decision between automatic rounds.
5. **Turn-based battle** — direct control, comparing a shared 2D battlefield with a Disciples-like six-slot formation.
6. **Real-time with pause** — direct squad control in a shared battlefield, Total War-like.

## Asset Reuse

The prototype references canonical ship art from [../../game/content/ships/images/](../../game/content/ships/images/). Ship images are not duplicated under `mockups/`.
