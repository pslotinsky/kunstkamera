# Gemfire — Conventions

Conventions for the Gemfire TypeScript codebase. Biome (formatter, linter, and import organizer) enforces layout and a baseline of lint rules; the conventions below cover everything it can't.

## Files & modules

- **One class per file; the filename matches the class name in PascalCase** — `WorldMap.ts` exports `class WorldMap`, `GameScreenComponent.ts` exports `class GameScreenComponent`. This holds for the UI too: a component is a class.
- Modules that are pure data or plain functions use **kebab-case** filenames — config (`provinces.ts`), render-models (`map-view-model.ts`), shared helpers (`dom.ts`).

## Classes

- **Every member has an explicit access modifier** (`public` / `private` / `protected`) — the constructor, fields, parameter-properties, and static methods all declare one.

- **Group fields by visibility, separated by a blank line — `public`, then `protected`, then `private`:**

  ```ts
  export class WorldMap {
    public readonly provinces: readonly Province[];

    private readonly provincesByNumber: Map<number, Province>;
  }
  ```

- **A long or defaulted parameter list becomes a single object.** A small value object whose fields are all required keeps the parameter-property shorthand (`Resources` below). An entity with many fields, defaults, or fields set after construction (`owner`, `governor`) takes one params object and assigns the fields in the body:

  ```ts
  export interface ProvinceParams {
    readonly number: number;
    readonly name: string;
    readonly neighbors: readonly number[];
    readonly resources?: Resources;
    readonly development?: Development;
  }

  export class Province {
    public readonly number: number;
    public readonly name: string;
    public readonly neighbors: readonly number[];
    public resources: Resources;
    public development: Development;
    public owner?: Family;
    public governor?: General;

    public constructor(params: ProvinceParams) {
      this.number = params.number;
      this.name = params.name;
      this.neighbors = params.neighbors;
      this.resources = params.resources ?? Resources.createEmpty();
      this.development = params.development ?? Development.createEmpty();
    }

    public isNeighbor(other: Province | number): boolean {
      const otherNumber = typeof other === 'number' ? other : other.number;
      return this.neighbors.includes(otherNumber);
    }
  }
  ```

- **Static methods come before the constructor** — static factories (`createEmpty`) at the top, then the constructor, then instance members:

  ```ts
  export class Resources {
    public static createEmpty(): Resources {
      return new Resources(0, 0, 0);
    }

    public constructor(
      public readonly gold: number,
      public readonly food: number,
      public readonly troops: number,
    ) {}
  }
  ```

- Use the **`private` keyword** for private fields, never `#`.
- **Constructors do no side-effecting work.** They wire dependencies (store params, construct collaborators) and may compute pure derived state — but no DOM building/attachment, I/O, event wiring, or other side effects. For a component that work belongs in the `onMount()` lifecycle hook, which runs once the element exists:

  ```ts
  public constructor(world: World) {
    super();
    this.world = world;
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => this.handleClick(event),
      { signal: this.domListeners.signal },
    );
  }
  ```

- **Method names are actions** — `createEmpty`, `build`, `getNeighbors`, `getProvince` — not nouns or prepositions (`empty`, `fromSeeds`, `neighboursOf`). The one exception is a boolean check: **prefix it with `is` / `has` / `can`** — `isNeighbor`, not the bare `borders` / `adjoins` (which read as state, not a question).
- **Law of Demeter — talk to a bound collaborator, not a chain.** Prefer exposing the thing you actually use and calling it directly: `this.map.getNeighbors(province)`, where `map` is a getter — `private get map(): WorldMap { return this.world.map; }` (a getter, not a stored field — don't cache what you can derive). Navigating an aggregate inline — `this.world.map.getNeighbors(province)` — is acceptable but weaker. Chaining off a value you just produced is out — `new WorldFactory().create().map.getProvince(1)`; bind it to a local first: `const { map } = new WorldFactory().create();` then `map.getProvince(1)`. (Reading a value off an aggregate for display, like `world.date`, is fine.)

## Types & values

- **Prefer `undefined` over `null`.** Use optional properties (`owner?: Family`), not `owner: Family | null = null`.
- **No trivial primitive type aliases.** `type ProvinceNumber = number` or `type ImageRef = string` adds indirection without safety — use the primitive. If a concept needs its own identity, make it a **real Value Object** (a class with behavior — helpers, validation, equality); otherwise use the primitive directly. Nothing in between.

## Naming & comments

- **No one-letter variable names** — including map/filter callbacks, sort comparators, and generic type parameters (`province`, `neighbor`, `left`/`right`, `index`, `ElementType`; `_unused` for a discard).
- **Self-documenting code over comments.** Encode intent in names and named constants (a `startDate` constant, not a `// placeholder` comment) rather than narrating the code.

## Control flow

- **Always brace conditionals; the body goes on its own line** — never a one-line `if`, even for a single statement:

  ```ts
  if (!app) {
    throw new Error('#app mount point missing from index.html');
  }
  ```

  not `if (!app) throw new Error(...)`.

- **No `continue` / `break` / `return` to jump out of a loop.** Express the intent without the jump — guard the body with an `if` instead of `continue`, prefer array methods (`filter`, `find`, `some`, `every`, `map`) over a loop that breaks or returns early:

  ```ts
  for (const view of views) {
    const pathElement = paths.get(view.number);
    if (pathElement) {
      pathElement.classList.toggle('selected', view.highlight === 'selected');
    }
  }
  ```

  An expression `return` inside a `.map()`/`.filter()` callback is fine — that returns from the callback, it is not a loop jump.

## UI & DOM

- **Render through trusted template strings — no manual DOM building, no untrusted HTML.** A component returns its markup as a template string from `render()`, and the base `Component` parses it once (via a `<template>` element). Everything interpolated must be trusted: static config and domain values (province names, counts), never unescaped user input. If dynamic text from outside the app ever enters a template, escape it first.
- **Component naming.** Every UI component class ends in `*Component` — `GameScreenComponent` (the top-level screen the player sees), `WorldMapComponent`, `GamePanelComponent`, `ProvinceInfoComponent`. Not `*View` (that is the render-model vocabulary — `ProvinceView`, `mapViewModel` — and these classes hold state and wire events, so they behave more like controllers than views); not `*Widget` (reserve that for low-level primitives like a `Button`).
- **One component, one concern, one DOM subtree — and they nest.** Split the UI into small components rather than one class that does everything: the top-level component (`GameScreenComponent`) builds the page layout and coordinates state (selection); each component owns a single concern — `WorldMapComponent` is the interactive SVG only (province paths, clicks, highlights — no domain), `GamePanelComponent` is the left rail that composes its own children (a `ProvinceInfoComponent` section, with command/family sections to follow). A parent pushes state down by calling its children's methods, and a child reports up by publishing a typed event (see below).
- **Components render to a string and own their lifecycle, not the constructor.** A component's constructor only wires dependencies (including constructing its child components). `render()` returns the component's HTML and embeds each child inline via `${child.render()}`; `onMount()` adopts that DOM and wires events. The root installs with `mount(container)` (builds its element, appends it); a child adopts its already-rendered DOM with `attach(container)`. **Each component declares its root class once as a `rootClass` field, used in its own `render()` and read by `attach()` to find itself — so a parent never names a child's root selector.** A parent calls `child.attach(this.element)`, never `child.attach(this.element.querySelector('.child-root'))`. `main.ts`: `new GameScreenComponent(world)` then `screen.mount(app)`.
- **A view renders once and updates in place — there is no rerender.** `render()` runs a single time at mount; every later change is a targeted DOM mutation on the standing element: toggle a class (`hide()`, highlights), flip a property (`disabled`), or swap a leaf's content with `this.element.innerHTML = this.renderContent()` (the info panel, the turn status). Both DOM listeners and inbound `subscribe(...)` registrations use the single base `lifetime` AbortController, aborted once in `unmount()` — nothing is wired twice and nothing leaks.
- **A child talks to its parent through a typed event, not a callback.** A child publishes a `CustomEvent` subclass — e.g. `ProvinceSelectedEvent extends CustomEvent<number>`, whose event type is its own class name (`super(ProvinceSelectedEvent.name, { detail: provinceNumber })`) and which exposes its payload through a named getter (`provinceNumber`) rather than the raw `detail`. The `EventBus` keys subscriptions off the class name and narrows with `instanceof`, so handlers are fully typed with no cast: `this.worldMap.subscribe(ProvinceSelectedEvent, (event) => this.selectProvince(event.provinceNumber))`. The same bus class serves the core (engine ↔ commands) and each component. The bus dispatches run-to-completion: an event published while another dispatches is queued FIFO, never nested — handlers may freely answer events with new events, and long reaction chains cannot overflow the stack.

## Formatting & linting

- Biome (`biome.json`) handles formatting, linting, and import organization in one tool — **single quotes**, 2-space indent, ~80-column width, trailing commas. Run `npm run check` to format + lint + organize imports and typecheck in one pass; `npm run check:ci` is the verify-only variant and must pass. `npm run format` and `npm run lint` apply each step alone.
- Imports are auto-grouped, blank-line separated, and sorted within each group: Node builtins, then packages, then the `@/` alias, then relative paths, with `.scss` side-effect imports left where they sit. Don't hand-order imports — let `biome check` do it.
- Biome is scoped to code (`data`, `docs`, `package-lock.json` are excluded) so reference material and generated files aren't reformatted. `noExplicitAny` is a warning, not an error, so the type-erased base-class generics in `src/lib` are allowed.
