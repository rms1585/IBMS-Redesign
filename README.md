# IBMS Redesign

Desktop app for IBMS, the Bangladesh land-port management platform (BLPA officers, C&F agencies, importers/exporters, bank staff and head office). Built from the *IBMS — Product, Workflow & UI Specification*.

- **Shell:** Electron 33, with a Vite + React 18 renderer
- **Design system:** Minimals-style theme on MUI 6 (Public Sans, soft labels, 16 px cards, dashed dividers, collapsible left navigation, light/dark mode)
- **Primary colour:** `#008F40`

> All data is demonstration fixtures (`src/data/mock.js`). Tariff values are an invented reference and are **not legal rates**. There is no backend yet.

## Run

```bash
npm install
npm run dev      # Vite dev server + Electron window with hot reload
npm run web      # renderer only, in the browser at http://localhost:5173
npm run build    # production renderer build into dist/
npm start        # Electron against the built dist/
npm run dist     # package installers (dmg / nsis / AppImage) into release/
```

## Hosting on GitHub

- **Web version (GitHub Pages):** every push to `main` builds the app and publishes it to https://rms1585.github.io/ibms-redesign/ (`.github/workflows/pages.yml`). Turn it on once under *Settings → Pages → Source: GitHub Actions*.
- **Desktop installers (GitHub Releases):** push a version tag (`git tag v0.1.0 && git push origin v0.1.0`) to build Windows `.exe`, macOS `.dmg` and Linux `.AppImage` files and attach them to a release (`.github/workflows/release.yml`). The installers are unsigned for now.

## Structure

```
electron/            main process and preload (context-isolated, sandboxed)
src/theme/           Minimals-style palette, typography and component overrides
src/layouts/         left navigation (grouped, collapsible to mini) and header
src/components/      Label, workbench (queue / record / rail), bay grid, data table, dialogs
src/pages/           one file per screen
src/data/mock.js     demo fixtures
```

## Screens

| Group | Screens |
|---|---|
| Overview | Home, Dashboard (Operations, Performance, Revenue, Resources, Control, Reports) |
| Operations | C&F portal, Importer/exporter portal, Manifest tracking (read-only), Border gate, Weighbridge, Posting / bay allocation, Warehouse receipt, Transshipment, Billing & payment, Inland gate |
| Administration | Platform setup (tariff, products, vehicle types, agencies, traders, holidays, ports), Port setup (4 steps + go-live checks), Warehouse layout, Storage rules, Products & routing, Vehicle classes, Equipment & labour, What this port charges, Technical settings (NSW + paper fallback), Roles (4-step builder), Users, Inbox (maker-checker), Audit log |

## Behaviour from the spec that the UI already follows

- Maker-checker: you cannot approve your own Inbox request, and bank fallback payments stay pending (not counted) until a *different* officer confirms them.
- Safety-critical actions (admit, manual weight, block zone, deactivate user, approve/reject) ask for confirmation, and audited ones require a reason.
- Bay allocation greys out bays that break active, symmetric separation rules or zone categories. Remove/shrink/re-grid on occupied zones is refused with the reason.
- Bills list each line's source event, tariff version and calculation, and the total is computed from the lines.
- Route changes at a live port stay pending until approved. Disabled branches (Stone route) can't be chosen.
- Departure checklists block exit on holds, unpaid balance or an invalid pass.

Open items from section 16 of the spec (tariff conflicts, departure legality, the canonical permission matrix and so on) are **not** settled here. Treat the demo values as placeholders.
