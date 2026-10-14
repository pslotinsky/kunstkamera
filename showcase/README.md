# Kunstkamera showcase

A React and TypeScript portal for games and documentation. Fumadocs provides the project navigation and documentation reader, along with Markdown compilation, contents navigation, code highlighting, and full-text search. React Router pre-renders the pages for GitHub Pages; no production application server is required.

## Structure

- `src/root.tsx` — document shell and Fumadocs providers.
- `src/layoutOptions.ts` — application-wide navigation and theme defaults shared by the home and project layouts.
- `src/routes.ts` and `src/routes/` — React Router routes, loaders, page UI, and page-specific components and styles.
- `src/documentation/` — the published document catalog, section order, page URLs, browser manifest, and shared types used by navigation, search, and document pages.
- `src/getProjectTree.server.ts` — the Gemfire navigation tree shared by the Play and Documentation routes.
- `src/components/` — shared UI grouped by responsibility, with related helpers, hooks, and SCSS modules kept together.
- `routes/Home/`, `routes/Game/`, and `routes/Site/` — project selection, embedded game, and outer layout.
- `routes/Documentation/` — section descriptions and document reader. `DocumentReader/` uses the generated browser loader and supplies relative document links and Mermaid rendering.
- `routes/ErrorPage/` — shared error display and route error boundary.
- `components/ProjectLayout/` — the Fumadocs layout shared by Play and Documentation.
- `components/Page/` — shared page presentation, titles, and focus behavior.
- `components/FrameworkLink/` — adapts Fumadocs page-tree URLs to the trailing-slash URLs served by GitHub Pages.
- `components/DocumentationSearch/` — Fumadocs search dialog using the static search database.
- `source.config.ts` — publication allowlist and Markdown configuration.
- `react-router.config.ts` — static route generation, using the same publication allowlist.
- `build/preparePages.ts` — combines the generated pages and assets into the Pages artifact and writes a static `404.html` from the pre-rendered not-found page.

Custom components use SCSS modules for spacing and layout, with Fumadocs theme tokens for colors. `src/root.css` is the global Tailwind and Fumadocs stylesheet imported by `root.tsx`. The embedded Gemfire game retains its own UI. Documentation search is shown in the documentation area.

## Published documentation

The collection reads visitor-facing documents directly from `gemfire/docs`: `ROADMAP.md`, numbered `design/[0-9]*.md` pages, `spec/*.md`, and `guides/README.md`. Content is compiled during development and builds and loaded through Fumadocs' generated modules. Contributor conventions and the design template remain in the repository but are not published.

Third-party guides and manual transcriptions are excluded. The authored references page links to their external sources. Total Space and Archer are outside the published scope. Generated `.source/`, `.react-router/`, and `dist/` directories are ignored.

Normal document addresses look like `/kunstkamera/gemfire/docs/design/01-global-map/`. Sections use native fragments such as `#glossary`.

The documentation route returns an index or document result; unknown document paths raise a 404. Client navigation shows the error inside the project layout. GitHub Pages serves the standalone `404.html` for direct visits to missing URLs, with a link back to the showcase home page.

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

## Build and preview

```sh
npm run check:ci --prefix showcase
npm run build --prefix showcase
npm run preview --prefix showcase
```

The build generates Fumadocs modules and React Router types, checks TypeScript, pre-renders pages and the search database, packages them in `dist/public`, and builds Gemfire into `dist/public/gemfire/game/`.

Preview serves exactly that static artifact at `http://127.0.0.1:4173/kunstkamera/`, without the framework's development or SSR middleware. Search runs in the browser against the pre-rendered database.

`SHOWCASE_BASE` defaults to `/kunstkamera/`. Use the same value for development, build, and preview when hosting elsewhere. React Router includes this base path in its generated page directories; the packaging step places those pages beside their assets for GitHub Pages.

## Publishing

Choose **GitHub Actions** in the repository's **Settings → Pages → Build and deployment**. The Pages workflow builds pull requests and publishes `showcase/dist/public` from `main`.

The expected URL is `https://pslotinsky.github.io/kunstkamera/`. Playwright is not a project dependency or a CI step. Do not commit generated files.
