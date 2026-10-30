# Game documentation conventions

Use these conventions for new games. Total Space and Sink City share this approach; a game's language, scope, and maturity can differ.

## Structure and authority

- `<game>/docs/README.md` introduces the project and links to its documentation areas.
- `game/README.md` provides the game-specific reading order and explains the current maturity and missing decisions.
- `game/vision.md` defines the high concept, player fantasy, tone, and design pillars.
- `game/overview.md` maps the intended game areas to their canonical documents. It summarizes without redefining rules and distinguishes intended areas from uncommitted possibilities.
- `game/systems/` owns game rules and intended player-facing behavior. Each system states the responsibility it owns.
- `game/content/` contains concrete authored material, such as rosters, events, or candidate city ideas. Label candidate collections explicitly; their presence does not commit them to the game.
- `game/milestones/` describes expected game state, scope, assumptions, and exit criteria at major stages. Milestones do not restate rules, task order, or engineering estimates.
- `tech/` describes software representation, architecture, and implementation constraints.
- `mockups/` contains presentation notes and interactive prototypes. Game design is authoritative for gameplay; mockups are authoritative only for the presentation and interactions they explicitly demonstrate. Experimental mechanics do not become rules by being implemented.

Create areas only when there is substantive material. Do not invent technical architecture, milestone scope, or placeholder catalogs to complete a directory tree. Use lowercase English paths; prose can use the project's chosen language.

## Canonical ownership

A rule has one canonical location. When several systems interact, the rule lives with the system that causes it; the others link to it. Summary documents may name or characterize a rule but must not redefine it. Game and technical documents are self-contained within their responsibilities; cross-links lead to specific supporting information.

Write accepted rules as direct statements. Keep current proposals and open questions with the system that owns the decision, clearly separated from accepted direction. Preserve relevant attribution and uncertainty when importing discussions. Authorship, prototype behavior, and the amount of text about an idea do not establish acceptance.

## Document statuses

- **CONCEPT** — purpose, boundaries, and major interactions are defined; rules are not.
- **DRAFT** — rules are being designed and still contain unresolved choices.
- **SPEC** — rules are concrete enough to implement without inventing game-design behavior in code.

Use `**Status:** CONCEPT`, `DRAFT`, or `SPEC` on vision and system documents. Status describes design maturity, not implementation progress or approval of every proposal in a document. Indexes, overview maps, content catalogs, and mockup notes do not receive game-rule maturity statuses. Do not promote a document simply because it was reorganized.

Document future systems at CONCEPT level and expand them when needed. Record project-wide gaps briefly in the game index; avoid a second queue that duplicates system questions.

## History and publication

Current-design documents describe the current design. History normally lives in version control. Imported source packages that need provenance can be preserved under `<game>/archive/`, outside the active documentation root, with a source note. Preserve substantive unresolved ideas in current documents as well as their historical sources.

The showcase publishes the root README and Markdown under `game/`, `tech/`, and `mockups/`. Contributor conventions, migration plans, and historical archives remain outside these game collections and game search. Link to this guide through its repository URL from published game indexes so it is readable without becoming a game page.

When moving documents, update cross-links, publication patterns, navigation categories and order, prototype registrations, and the showcase README. Preserve public prototype routes. Redirect replaced document URLs if they have been published or shared; unpublished imports can move directly.

Delete prose that does not constrain the game, content, implementation, or validation. Verify source coverage, links, maturity and acceptance labels, prototype assets, showcase checks, and the static build.
