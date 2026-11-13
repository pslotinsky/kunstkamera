# Kingdom HR — Recruitment Prototype

Source snapshot: df974299540d260ca12231f4c6552a34a7577e61

## Run locally

From this directory, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser. No build step or npm packages are required.
Progress is stored in the browser's localStorage.

## Files

- `dist/index.html`: page structure.
- `dist/app.js`: recruitment logic and UI.
- `dist/content.js`: jobs, candidates, experience, and area conditions.
- `dist/burn.js`: paper burn animation.
- `dist/style.css`, `dist/illustrated.css`: styling and animation.
- `dist/assets/`: WebP artwork and portrait atlas.
- `tests/recruitment.test.cjs`: Node.js tests.
- `.openai/hosting.json`: existing Sites hosting configuration.

## Run tests

With Node.js installed, run:

```sh
node --test tests/recruitment.test.cjs
```

This is a static browser application; it can also be hosted on any static web server.
