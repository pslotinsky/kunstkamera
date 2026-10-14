# Gemfire — Conventions

Conventions for the Gemfire TypeScript codebase. Biome (formatter, linter, and import organizer) enforces layout and a baseline of lint rules; the conventions below cover everything it can't.

## Files & modules

- **One class per file; the filename matches the class name in PascalCase** — `WorldMap.ts` exports `class WorldMap`, `GameScreenView.ts` exports `class GameScreenView`. This holds for the UI too: each component is a `View` class (markup + in-place DOM updates) paired with a `Control` class (state + coordination), one class per file.
- Files exporting a single helper function use the function’s **camelCase** name — `countTo.ts`, `isDefined.ts`, `unitPreview.ts`. Pure data and multi-function modules use **kebab-case** filenames — config (`provinces.ts`), render-models (`map-view-model.ts`), shared helpers (`dom.ts`).

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
- **Constructors do no side-effecting work.** They wire dependencies (store params, construct collaborators) and may compute pure derived state — but no DOM building/attachment, I/O, subscriptions, or other side effects. For a component the markup is its `template` getter, and side-effecting setup (subscriptions, imperative DOM that a template can't express) belongs in the `onMount()` lifecycle hook, which runs once the element exists:

  ```ts
  public constructor(world: World) {
    super();
    this.world = world;
  }

  protected override onMount(): void {
    this.subscribe(ProvinceSelectedEvent, (event) =>
      this.selectProvince(event.provinceNumber),
    );
  }
  ```

- **Method names are actions** — `createEmpty`, `build`, `getNeighbors`, `getProvince` — not nouns or prepositions (`neighboursOf`). Two exceptions: a boolean check takes an **`is` / `has` / `can` prefix** — `isNeighbor`, not the bare `borders` / `adjoins` (which read as state, not a question) — and a conversion or factory may be named for its source or target: `from()`, `of…()`, `to…()` (`Resources.from`, `Gem.ofName`, `toEntity`).
- **Law of Demeter — talk to a bound collaborator, not a chain.** Prefer exposing the thing you actually use and calling it directly: `this.map.getNeighbors(province)`, where `map` is a getter — `private get map(): WorldMap { return this.world.map; }` (a getter, not a stored field — don't cache what you can derive). Navigating an aggregate inline — `this.world.map.getNeighbors(province)` — is acceptable but weaker. Chaining off a value you just produced is out — `new WorldFactory().create().map.getProvince(1)`; bind it to a local first: `const { map } = new WorldFactory().create();` then `map.getProvince(1)`. (Reading a value off an aggregate for display, like `world.date`, is fine.)

## Types & values

- **Prefer `undefined` over `null`.** Use optional properties (`owner?: Family`), not `owner: Family | null = null`.
- **A concept is a class, not a plain structure.** We model with entities, so anything the domain has a name for — an outcome, a report, a battle — is a class with its own behaviour, even when it starts as pure data: `BattleOutcome` answers `isWonBy(side)`, `InvasionReport` answers `isFought` / `isTaken`, so callers ask the object instead of re-deriving the same test from its fields. Interfaces and type aliases are for **shapes that are not concepts** — a parameter bag (`ProvinceParams`, `InvasionReportParams`), a config record, a render-model. If you find yourself writing the same `outcome?.isWonBy('attacker') ?? true` in two places, the structure wanted to be a class.

- **No trivial primitive type aliases.** `type ProvinceNumber = number` or `type ImageRef = string` adds indirection without safety — use the primitive. If a concept needs its own identity, make it a **real Value Object** (a class with behavior — helpers, validation, equality); otherwise use the primitive directly. Nothing in between.

## Naming & comments

- **No one-letter variable names** — including map/filter callbacks, sort comparators, and generic type parameters (`province`, `neighbor`, `left`/`right`, `index`, `ElementType`; `_unused` for a discard).
- **Self-documenting code over comments.** Encode intent in names and named constants (a `startDate` constant, not a `// placeholder` comment) rather than narrating the code. Provenance and rationale — where a number comes from, which source a formula reconstructs, why a value was chosen — belong in the feature's design doc under `docs/design/`, not in a code comment.

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

- **A call that does work gets its own line.** Bind it to a named local, then pass the local — never bury a side-effecting or domain call inside another call's argument list:

  ```ts
  const result = invasion.launch();

  this.report(source, target, army, result);
  ```

  not `this.report(source, target, army, invasion.launch())` — the nested form hides where the work happens and reads in the wrong order (the reporting first, the war that produced it second). Cheap pure expressions (`String(date)`, `province.number`, a literal) stay inline. Same reasoning as the Law of Demeter rule above: name the thing you just produced.

## UI & DOM

- **Render with lit-html, once — no manual DOM building, no untrusted HTML.** A `View`'s markup is its `template` getter, which returns a lit-html `TemplateResult` from an `html` tagged template; the base `View` renders it into the element once at mount and never re-renders. Everything interpolated must be trusted: static config and domain values (province names, counts), never unescaped user input — lit escapes text bindings by default, and `unsafeHTML` is reserved for trusted raw markup (the map SVG).
- **Component naming.** Each UI component is a pair: a `*View` class (`GameScreenView`, `WorldMapView`, `ProvinceInfoView`) owning markup and in-place DOM updates, and a `*Control` class (`GameScreenControl`, `WorldMapControl`, …) owning state, coordination, and event subscriptions. The split is what makes the `*View` name honest — coordination lives in the control, not the view. Reserve `*Widget` for low-level primitives (a `Button`); render-models stay plain data in kebab-case modules (`map-view-model.ts`), not `*View` classes.
- **One component, one concern, one DOM subtree — and they nest.** Split the UI into small components rather than one class that does everything: `GameScreenControl` coordinates top-level state (selection, the active turn) while `GameScreenView` lays out the page; each component owns a single concern — `WorldMapView` is the interactive SVG only (province paths, clicks, highlights — no domain), `GamePanelView` is the left rail that composes its children (`ProvinceInfoView`, `ProvinceCommandsView`). A parent control pushes state down by calling its child controls' methods, and a child reports up by publishing a typed event (see below).
- **A View's markup is its `template` getter; events bind inline; lifecycle lives in `mount`/`onMount`, not the constructor.** Constructors only wire dependencies — a `Control` constructs its `View` and its child controls. The `View`'s `template` getter returns its lit-html markup and embeds each child inline via `${this.views.child.template}`; event handlers are declared inline as lit bindings (`@click=${() => this.publish(new TurnSkippedEvent())}`), so there is no manual `addEventListener` except for raw injected markup like the map SVG (delegation in `onMount`). The root installs with `mount(container)` — it renders its template once, then locates its element; a child adopts its already-rendered DOM with `attach(container)`. **Each View declares its root class once as a `rootClass` field, read by `rootSelector`/`attach()` to find itself — so a parent never names a child's root selector** (a parent calls `child.attach(this.element)`, never `child.attach(this.element.querySelector('.child-root'))`). `main.ts`: `new GameScreenControl({ world, events, commands })` then `screen.mount(app)`.
- **A View renders once and updates in place — there is no rerender.** The `template` getter renders a single time at mount; every later change is a targeted DOM mutation on the standing element: toggle a class (`hide()`, highlights), flip a property (`disabled`), or swap a leaf's content with `this.element.innerHTML = …` (the info panel, the turn status). Both DOM listeners and inbound `subscribe(...)` registrations use the single base `lifetime` AbortController, aborted once in `unmount()` — nothing is wired twice and nothing leaks.
- **A child talks to its parent through a typed event, not a callback.** An event is a plain class carrying its payload as readonly fields — `class ProvinceSelectedEvent { constructor(public readonly provinceNumber: number) {} }` — no DOM `Event`/`CustomEvent` inheritance, so events log clean in the console (`events.observe` + `console.debug` in dev mode shows the whole causal chain without DOM noise). The `EventBus` keys subscriptions by the event's constructor, so handlers are fully typed with no cast: `this.worldMap.subscribe(ProvinceSelectedEvent, (event) => this.selectProvince(event.provinceNumber))`. The same bus class serves the core (engine ↔ commands) and each component. The bus dispatches run-to-completion: an event published while another dispatches is queued FIFO, never nested — handlers may freely answer events with new events, and long reaction chains cannot overflow the stack.

## Formatting & linting

- Biome (`biome.json`) handles formatting, linting, and import organization in one tool — **single quotes**, 2-space indent, ~80-column width, trailing commas. Run `npm run check` to format + lint + organize imports and typecheck in one pass; `npm run check:ci` is the verify-only variant and must pass. `npm run format` and `npm run lint` apply each step alone.
- Imports are auto-grouped, blank-line separated, and sorted within each group: Node builtins, then packages, then the `@/` alias, then relative paths, with `.scss` side-effect imports left where they sit. Don't hand-order imports — let `biome check` do it.
- Biome is scoped to code (`data`, `docs`, `package-lock.json` are excluded) so reference material and generated files aren't reformatted. `noExplicitAny` is a warning, not an error, so the type-erased base-class generics in `src/lib` are allowed.

## Commits

- **Commit per task — small and focused.** Land each discrete change as its own commit once it is green (`npm run check` and tests pass), rather than letting many tasks pile up on the working tree and landing one sweeping batch — small commits are reviewable, large ones are not; split separable concerns (a refactor, a feature, docs, tests) into their own commits when they don't depend on each other.
