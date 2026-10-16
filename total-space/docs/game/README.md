# Game Design Documentation

This directory is the source of truth for game rules and intended player-facing behavior.

## Start here

1. [`vision.md`](./vision.md) — what game we are making.
2. [`overview.md`](./overview.md) — compact map of the systems expected in the final game.
3. [`milestones/`](./milestones) — expected state of the game at major development stages.
4. [`systems/`](./systems) — canonical rules for individual game systems.
5. [`content/`](./content) — concrete authored game content.

## Document statuses

- **CONCEPT** — purpose, boundaries, and major interactions are defined; rules are not.
- **DRAFT** — rules are being designed and still contain unresolved choices.
- **SPEC** — rules are concrete enough to implement without inventing game-design behavior in code.

Status describes the design maturity of the rules a document currently contains, not implementation progress. Content documents such as rosters carry no status.

## Rules

- A rule has one canonical location.
- Each system document states the responsibility it owns. A rule that involves several systems lives in the document of the system that causes it; the others link to it.
- Summary documents may name or characterize a rule, but must not redefine it.
- Documents describe the current design only; history lives in version control.
- Write accepted rules as statements, not as `may`, `could`, or `possibly`.
- Future systems are documented early at **CONCEPT** level and expanded only when needed.
- Milestones describe expected game state, scope, assumptions, and exit criteria; they do not restate system rules, task order, or engineering estimates.
- Delete prose that does not constrain the game, content, implementation, or validation.
