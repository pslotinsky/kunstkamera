# Kunstkamera showcase

A React and TypeScript portal for games and documentation. Fumadocs provides the project navigation and documentation reader, along with Markdown compilation, contents navigation, code highlighting, and full-text search. React Router pre-renders the pages for GitHub Pages; no production application server is required.

## Structure

- `src/root.tsx` — document shell and Fumadocs providers.
- `src/layoutOptions.ts` — application-wide navigation and theme defaults used by the showcase layout.
- `src/routes.ts` and `src/routes/` — React Router routes, loaders, page UI, and page-specific components and styles.
- `src/documentation/` — the published document catalog, section order, page URLs, browser manifest, and shared types used by navigation, search, and document pages.
- `src/getNavigationTree.server.ts` — a single navigation tree for all projects, shared by the index, play, prototype, and documentation routes.
- `src/projects.ts` — shared project names, identifiers, and registry mapping.
- `src/games.ts` — playable-game names and development and published iframe URLs; it also determines play links and pre-rendered play routes.
- `src/prototypes.ts` — interactive prototype names, routes, source files, and published paths shared by navigation, pages, and build tools.
- `src/publishedAssets.ts` — asset files and directories shared by documentation URLs, development serving, and the Pages packaging step.
- `src/components/` — shared UI grouped by responsibility, with related helpers, hooks, and SCSS modules kept together.
- `routes/DocumentationIndex/` — the documentation index for all projects.
- `routes/Game/` and `routes/Prototype/` — embedded interactive content.
- `routes/Documentation/` — section descriptions and document reader. `DocumentReader/` uses the generated browser loader and supplies relative document links and Mermaid rendering.
- `routes/ErrorPage/` — shared error display and route error boundary.
- `components/ShowcaseLayout/` — the Fumadocs layout shared by the index, games, prototypes, and documentation.
- `components/Page/` — shared page presentation, titles, and focus behavior.
- `components/FrameworkLink/` — adapts Fumadocs page-tree URLs to the trailing-slash URLs served by GitHub Pages.
- `components/DocumentationSearch/` — Fumadocs search dialog using the static search database.
- `source.config.ts` — publication allowlist and Markdown configuration.
- `src/documentation/config.ts` — the mapping between projects and generated documentation collections, plus documentation-route identification.
- `react-router.config.ts` — static route generation from the project/collection mapping and publication allowlists.
- `build/preparePages.ts` — combines the generated pages and assets into the Pages artifact and writes a static `404.html` from the pre-rendered not-found page.

Custom components use SCSS modules for spacing and layout, with Fumadocs theme tokens for colors. `src/root.css` is the global Tailwind and Fumadocs stylesheet imported by `root.tsx`. The embedded Gemfire game retains its own UI. Search covers all published documentation, labels results by project, and is available on the index and documentation pages.

## Published documentation

The Gemfire collection reads visitor-facing documents directly from `gemfire/docs`: `ROADMAP.md`, numbered `design/[0-9]*.md` pages, `spec/*.md`, and `guides/README.md`. The Total Space collection reads `README.md` and the Markdown under `game/`, `tech/`, and `mockups/` from `total-space/docs`. Content is compiled during development and builds and loaded through Fumadocs' generated modules. Contributor conventions and the Gemfire design template remain in the repository but are not published.

Third-party guides and manual transcriptions are excluded. The authored references page links to their external sources. Archer remains outside the published scope. Generated `.source/`, `.react-router/`, and `dist/` directories are ignored.

Normal document addresses look like `/kunstkamera/gemfire/docs/design/01-global-map/` and `/kunstkamera/total-space/docs/game/overview/`. Sections use native fragments such as `#glossary`. The Total Space campaign and battle prototypes are available at `/kunstkamera/total-space/prototypes/campaign/` and `/kunstkamera/total-space/prototypes/battle/`.

The documentation route returns an index or document result; unknown document paths raise a 404. Client navigation shows the error inside the project layout. GitHub Pages serves the standalone `404.html` for direct visits to missing URLs, with a link back to the documentation index.

## Development

Use Node 24, matching `gemfire/.nvmrc`:

```sh
npm ci --prefix gemfire
npm ci --prefix showcase
npm run dev --prefix showcase
```

Open `http://localhost:5173/kunstkamera/`. To play during development, also run:

```sh
npm run dev:game --prefix showcase
```

Gemfire runs at `http://localhost:5174/`. `VITE_GAME_URL` can override the iframe URL.
To add another playable project, register it in `src/games.ts` and include its built files at the configured published path in the Pages build.

## Build and preview

```sh
npm run check:ci --prefix showcase
npm run build --prefix showcase
npm run build:game --prefix showcase
npm run preview --prefix showcase
```

The showcase build generates Fumadocs modules and React Router types, checks TypeScript, pre-renders pages and a combined search database, packages them in `dist/public`, and copies the Total Space prototypes and their images and data into `dist/public/total-space/`. For local preview, run `build:game` afterward to build Gemfire into `dist/public/gemfire/game/`. The showcase build recreates `dist/public`, so game files must be added after it finishes.

Preview serves exactly that static artifact at `http://127.0.0.1:4173/kunstkamera/`, without the framework's development or SSR middleware. Search runs in the browser against the pre-rendered database.

`SHOWCASE_BASE` defaults to `/kunstkamera/`. Use the same value for development, build, and preview when hosting elsewhere. React Router includes this base path in its generated page directories; the packaging step places those pages beside their assets for GitHub Pages.

## Publishing

Choose **GitHub Actions** in the repository's **Settings → Pages → Build and deployment**. The **CI** workflow (`.github/workflows/ci.yml`) validates, tests, and builds Gemfire through the reusable `gemfire-ci.yml` workflow, which uploads the `gemfire-game` artifact. The Showcase job then checks and builds the site and downloads that game artifact into `showcase/dist/public/gemfire/game/` before uploading the combined Pages artifact. Showcase does not install Gemfire dependencies or rebuild the game. Pull requests validate and build the site. On `main`, **Deploy GitHub Pages** publishes `showcase/dist/public` after both jobs succeed.

The expected URL is `https://pslotinsky.github.io/kunstkamera/`. Playwright is not a project dependency or a CI step. Do not commit generated files.
