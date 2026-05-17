# Simple Garden Planner

A browser-based garden planning tool. Draw your plot on a reference photo, place trees and bushes, add a labelled bed grid, and export schematic plans as PNG or PDF.

All data stays in your browser (localStorage + optional JSON/CSV files). No account required.

**Live demo:** https://jan1s.github.io/simple-garden-planner/

## Features

- **Reference image** — Upload JPG/PNG aerial or site photos (auto-resized for performance)
- **Plot & structures** — Plot outline, buildings, terraces, paths, fences
- **Plants** — Trees (`B-01`, …) and bushes (`S-01`, …) with species, diameter, opacity, and comments
- **Bed grid** — Adjustable cell size, orientation, and origin inside the plot; labels like `A1`, `B2`, `C4`
- **Grid handles** — Drag origin and rotation on canvas when the plot is selected
- **Scale** — Calibrate real-world meters for dimensions and grid spacing
- **Dimensions** — Measure distances on the plan
- **Plant table** — Editable list with CSV import/export
- **Export** — PNG/PDF plan export; save/load full scene as JSON
- **Plot lock** — Prevent accidental moves of the plot outline

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pixi.js](https://pixijs.com/) + [pixi-viewport](https://github.com/davidfig/pixi-viewport) for the canvas
- [Zustand](https://zustand.docs.pmnd.rs/) for application state
- [jsPDF](https://github.com/parallax/jsPDF) for PDF export

## Getting started

### Prerequisites

- Node.js 20+

### Install and run

```bash
git clone https://github.com/jan1s/simple-garden-planner.git
cd simple-garden-planner
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

### GitHub Pages

Pushes to `main` deploy automatically via GitHub Actions.

1. In the repo on GitHub: **Settings → Pages → Build and deployment** → Source: **GitHub Actions**
2. After the workflow runs, the app is at: https://jan1s.github.io/simple-garden-planner/

Local build matching Pages (subpath `/simple-garden-planner/`):

```bash
npm run build:pages
npm run preview
```

## Quick guide

1. **Upload image** — Toolbar → Upload image  
2. **Set scale** — Scale tool → two points on a known distance → enter length in meters  
3. **Draw plot** — Plot tool → click corners → Enter or double-click to close  
4. **Bed grid** — Select plot → Properties → enable grid; drag orange handles to align  
5. **Add plants** — Tree/Bush tools, or edit in **Plants** table  
6. **Export** — Export (PNG/PDF) or Save JSON to share the project  

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| Space + drag | Pan |
| Right-drag | Pan |
| Scroll | Zoom |
| Enter | Finish polygon/polyline |
| Delete | Remove selection |
| Ctrl+Z / Ctrl+Shift+Z | Undo / redo |

## Project structure

```
src/
  components/     # Toolbar, panels, modals
  export/         # PNG, PDF, CSV, plant table
  model/          # Scene types, geometry, grid
  pixi/           # Canvas rendering and tools
  store/          # Zustand scene store
```

## License

MIT
