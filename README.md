# Personal site — Paul Frappier

A React single-page app with a pixel-art twist: alongside the usual project
pages there is a walkable pixel museum and a force-directed graph of how the
projects relate to each other. A small Flask server hosts the production build.

## Getting started

The frontend and the server are developed separately.

```bash
# Frontend, with hot reload on http://localhost:5173
cd frontend
npm install
npm run dev
```

```bash
# Server, serving the built frontend on http://localhost:5000
pip install -r requirements.txt
python app.py
```

The server only ever reads `frontend/dist`, so run `npm run build` in
`frontend/` before starting it.

### Frontend scripts

| Script            | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Vite dev server with hot reload       |
| `npm run build`   | Production build into `frontend/dist` |
| `npm run preview` | Serves the production build locally   |

## Deployment

Heroku-style: `heroku-postbuild` in the root `package.json` builds the frontend,
and the `Procfile` runs `gunicorn app:app`. `app.py` serves the built assets and
falls back to `index.html` so client-side routes survive a refresh.

## Project layout

```
app.py                    Flask server for the production build
frontend/
  vite/poseAssetsPlugin.js  Turns folders of PNGs into importable manifests
  public/                   Static art, served as-is (see "Artwork" below)
  src/
    main.jsx                Entry point
    App.jsx                 App shell: navbar + routed content
    routes.jsx              Route table, shared with the navbar
    pages/                  One thin component per route
    features/               Self-contained slices, each with its own CSS
      graph/                Force-directed project graph
      home/                 Landing page hero and showcases
      museum/               Walkable pixel museum
      projects/             Project cards and detail page layouts
    shared/                 Cross-feature UI, helpers and global styles
    dev/                    Development-only tooling (see "Pose editor")
    types/                  Ambient types for the generated virtual modules
```

Pages stay presentational; anything with real logic lives in a feature. The two
canvas-heavy features keep their simulation code in an `engine/` folder so the
React component only deals with rendering and input.

## Artwork

Nothing under `public/` is referenced by name in the code. The Vite plugin in
`vite/poseAssetsPlugin.js` scans these folders at build time and exposes them as
virtual modules, so adding art is a drag-and-drop change:

| Folder                            | Virtual module                 | Naming                                        |
| --------------------------------- | ------------------------------ | --------------------------------------------- |
| `public/positions`                | `virtual:pose-assets`          | `pos_<name>.png` → pose `<name>`               |
| `public/main_positions`           | `virtual:main-pose-assets`     | same                                           |
| `public/museum/bg_char`           | `virtual:museum-pose-assets`   | same                                           |
| `public/museum/projects/pictures` | `virtual:museum-exhibits`      | `<project-slug>_<stand>.png`, hung on a wall   |
| `public/museum/projects/pedestal` | `virtual:museum-exhibits`      | `<project-slug>_<stand>.png`, sat on a plinth  |

The museum floor plan comes from `public/museum/museum_outline.png`, hand-drawn
on top of `museum.png`: red strokes are walls the player cannot cross, and blue
blobs mark the fifteen numbered stands. After re-exporting either image, bump
`ASSET_VERSION` in `src/features/museum/engine/config.js` so browsers refetch
them. Press `H` in the museum to see the detected walls and markers.

## Pose editor

`src/dev` contains a small tool for positioning pixel-art poses on a page. It is
lazy-loaded behind `import.meta.env.DEV`, so it never reaches production.

Open it with `?poseEdit=1` or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>, drag
poses into place, then copy the JSON it produces into a placements file — for
example `src/features/home/homePlacements.json`, which `PosePlacements` renders
and scales to the current page width.
