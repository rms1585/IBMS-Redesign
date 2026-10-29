# IBMS Redesign — Design Notes

The rules and small decisions this app follows. Several of them were explicit requests after review,
so keep them unless the product owner changes them. When you change one, update this file in the same commit.

---

## 1. Source of truth

- **Figma file:** `IBMS` (file key `sdIfB3NDRRRENCUi2MfLfU`). The design system lives on its *Design System* pages
  (Color & Typo, Button, Text Input Field, Search, Top Nav Bar, Alert, Table, Tabs, Dropdown, Tag/Chips/Status,
  Dialog, Other Component).
- **Never change anything in the existing Figma design system.** Read from it only.
- Building screens in Figma is **not needed**. An `IBMS Theme` variable collection (Light/Dark) was added to the
  file earlier with approval; it aliases the existing Minimals colours and changes nothing else.
- Product spec: *IBMS — Product, Workflow & UI Specification* (the PDF this app was built from).
- All data is demo fixtures in `src/data/mock.js`. Tariff values are an invented reference and the UI says
  **"not legal rates"** wherever tariffs appear. The header shows a **DEMO DATA** label.

## 2. Colours (`src/theme/palette.js`)

Values come from the Figma colour styles. Use theme tokens (`primary.main`, `warning.text` …), never raw hex in pages.

| Palette | Lighter | Light | Main | Dark | Darker | Text on tint |
|---|---|---|---|---|---|---|
| Primary (Forest Green) | `#D6FFE9` | `#ADFFD3` | **`#008F40`** | `#00662E` | `#002912` | `#00753A` |
| Info (Sky Blue) | `#EFF3FF` | `#BDCFFF` | `#4166FB` | `#0C1BC7` | `#141E87` | `#0C1BC7` |
| Success | `#D8FBEC` | `#86E8BF` | `#1A9C65` | `#1B8056` | `#0A5536` | `#1B8056` |
| Warning (Orange) | `#FFF6E7` | `#FFE4B5` | `#FFA70F` | `#E8980E` | `#B5770B` | `#945700` |
| Error | `#FFF1F1` | `#FF9D9D` | `#FF3030` | `#C80D0D` | `#881414` | `#C80D0D` |

- **Greys:** 100 `#F4F5F7`, 200 `#EAECF0`, 300 `#DFE3E8`, 400 `#C4CDD5`, 500 `#919EAB`, 600 `#677481`,
  700 `#49525B`, 800 `#2B3136`. (900 `#161B1F` is ours, for dark-mode surfaces only.)
- **Text:** primary `#2B3136`, secondary `#677481`, disabled `#919EAB`.
- **Secondary palette = Sky Blue.** The design system has no secondary colour.
- **Text on soft tinted backgrounds** (status labels, KPI icon tiles, avatars) uses the palette's `text` shade in
  light mode and its `light` shade in dark mode. Never use `warning.dark` for text: `#E8980E` is unreadable on a tint.
- **Translucent overlays** (hover, selected, borders, dividers, scrollbars) are tints of Grey/800 in light mode and
  Grey/500 in dark mode, matching the design system's `Grey/8–48%` styles.
- **Dark mode:** background `#161B1F`, paper `#22292F`, neutral `#2E363D`, text white / Grey 500. The toggle is in
  the header and the choice is remembered in `localStorage`.
- **Charts:** don't use `primary.light` (`#ADFFD3`) for a series; it disappears on white. Use `primary.dark`.
- **Money:** write amounts as `BDT 1,234.56` (`formatBDT`). Don't use the ৳ sign: Public Sans lacks it and it
  renders from a fallback font.

## 3. Typography (`src/theme/index.js`)

Public Sans (bundled through `@fontsource/public-sans`, weights 400–800). Desktop scale from Figma:

| MUI variant | Figma style | Size / line height | Weight |
|---|---|---|---|
| h1 | H1 | 64 / 80 | 700 |
| h2 | H2 | 48 / 64 | 700 |
| h3 | H3 | 32 / 48 | 700 |
| h4 (page titles) | H4 | 28 / 36 | 700 |
| h5 | H5 | 24 / 32 | 700 |
| h6 (card titles) | H6 | 20 / 30 | 700 |
| subtitle1 | Body1/Semibold | 16 / 24 | 600 |
| subtitle2 | Body2/Semibold | 14 / 20 | 600 |
| body1 | Body1/Regular | 16 / 24 | 400 |
| body2 | Body2/Regular | 14 / 20 | 400 |
| caption | Caption/Regular | 12 / 16 | 400 |
| overline | Caption/Bold, uppercase | 12 / 16 | 700 |
| button | Body2/Semibold | 14 / 20 | 600 |

Plates, manifest IDs and references use a monospace font.

## 4. Icons (`src/components/icons.jsx`)

- **Hugeicons, Stroke Rounded, 1.5px stroke** (`@hugeicons/react` + `@hugeicons/core-free-icons`), as in the Figma file.
  Don't add `@mui/icons-material` back.
- Import icons from `src/components/icons.jsx` only. Each export keeps the old MUI-style name
  (e.g. `LocalShippingRoundedIcon`) and accepts `fontSize`, `color` and `sx`. Add new icons there.
- Figma's `torii-gate` icon is in the paid Hugeicons set only, so the inland gate uses `signpost`.
- Trucks use `container-truck-02`, search `search-01`, timers `stop-watch`, "more" `more-vertical`.

## 5. Logo

- BLPA logo at `src/assets/blpa-logo.png`, top-left of the navigation in both full and collapsed states.
- Shown at 40×40 on a white circle with 2px padding, so its dark-green ring stays visible in dark mode.

## 6. Buttons

- **Sizes = Figma CTA sizes:** Large 48px (16px label, 20px side padding); Medium 40px (14px SemiBold, 16px side
  padding); Small 36px (14px SemiBold, 16px side padding). 8px corner radius, 8px icon-to-label gap, labels never wrap.
- **Every primary action is a filled primary-green button (`#008F40`)**, including page-header actions
  (Export, Create role, New user, New rule, Create facility, Add equipment, Record bank fallback, Create port,
  Register unexpected truck …) and dialog confirms (including "Admit and flag"). Never use dark/black filled buttons.
- **Destructive confirmations stay red:** Block zone, Deactivate user, Reject (Inbox).
- **All buttons in one action row are the same size.** If the main action is Large, the secondary and text buttons
  beside it are Large too (e.g. Report problem / Admit truck; Re-weigh / Enter manually / Confirm weight).
- Still outlined (secondary) in page headers: "Import …" (Platform setup), "Import rules" (Storage rules),
  "Export" (Audit log).

## 7. Row actions and alignment

- **A row action must never shift position when another action is absent.** Give each action its own table column
  (C&F portal: "Pay now" column + "View details" column) or a fixed-width slot (Transshipment receivers: 96px status
  slot + 136px action slot).
- Swapping actions in the same slot is fine (Roles: Copy ↔ Edit after "View access").

## 8. Tables

- **Never shrink columns.** In full-size data tables, cell content stays on one line (`white-space: nowrap`, set in
  the theme for every non-`small` table). When a table is wider than its card, it **scrolls sideways inside the card**
  (cards have `overflow-x: auto`). Full-size tables have a minimum width of 680px.
- Compact tables (`size="small"`) in side panels and dialogs may wrap.
- **All columns are left-aligned:** headers and cells, including amounts, counts, statuses and action buttons.
  Don't use `align="right"` / `align="center"` on table cells or DataTable columns.
- Two-line cells are intentional where used: an ID with a secondary line under it (manifest + product,
  receipt + date, payer + method).
- First column has 24px left padding (`pl: 3`), last column 24px right padding (`pr: 3`); totals rows follow the same.

## 9. KPI cards (`KpiCard` in `src/components/common.jsx`)

- 16px padding; 40×40 icon tile (10px radius, tinted background, `text` colour icon) at the top right.
- Title: subtitle2, secondary colour.
- Optional **note** under the title: caption size, in round brackets, e.g. **"(View queue)"**; it is a link when
  `noteTo` is set (Trucks in port → `/border-gate`). Use a note instead of an extra line under the value.
- **Value sits under the title/icon row, 12px below it, on one line only** (never wraps). Its size scales with the
  card: `clamp(16px, 13cqi, 32px)` (the card is a size container). All cards in a row share a size, so their values
  match.
- KPI grids: `xs 12 · sm 6 · lg 3` (4-up rows) or `lg 4` (3-up rows).

## 10. Layout and responsive behaviour

- **Navigation:** at 1200px and wider, full sidebar (280px). From 900 to 1199px (iPad landscape), the 88px icon rail by
  default (the arrow expands it). Below 900px (iPad portrait), the sidebar is hidden and a ☰ menu button in the header
  opens it as a drawer, which closes after a page is chosen.
- **Header:** paddings shrink on small screens; the DEMO DATA label and camera icon hide below 600px; the user's
  name hides below 900px (avatar stays).
- **Content area** is a named size container, `main`. Layout breakpoints use `@container main (…)` queries, so they
  respond to the space actually available with the navigation open or collapsed.
- **Workbenches** (Border gate, Inland gate, Weighbridge, Posting, Warehousing): **queue, record and camera/details
  columns ALWAYS stay side by side.** Never move the third column under the record or stack the columns.
  - Queue column `clamp(200px, 27cqi, 296px)`, right column `clamp(196px, 25cqi, 272px)`, record takes the rest.
    Gap 24px, 16px when the content area is 900px or narrower.
  - On smaller screens **the middle column adapts its content**. It is a size container named `record`; below 520px:
    card side padding 16px, plate (`.record-plate`) 1.125rem, action rows (`.record-actions`) become full-width
    buttons stacked with the main action on top.
  - Form fields in a record (`.record-fields`) use an auto-fit grid (min 220px) so they go one per row when narrow.
  - Detail rows (`DetailRow`) put the label above the value when there's no room beside it.
  - Side columns: queue status labels wrap; "Plate read" and its match label wrap; Recent movements is a compact
    list (plate with the time under it, In/Out label on the right). Nothing may overflow a narrow column.
- **Cards side by side share a height:** in a grid row, every card takes the height of the tallest card in that row.
  A global theme rule makes a card that is the only item in its grid cell fill the row (`height: 100%`). Cards
  stacked inside one column (e.g. C&F portal Billing summary + Alerts) keep their natural heights.
- **Page and card headers** wrap their action buttons below the title instead of overflowing.
- Side panels in Port setup and Warehouse layout are 3/9 columns from `lg`, stacked below that.
- Checked sizes: iPad portrait 768 / 820, iPad landscape 1024 / 1180, iPad Pro 1366, laptop 1440, wide 1920.
  No page may scroll sideways; only tables scroll, inside their cards.
- Desktop app (Electron) minimum window: 1024×700.

## 11. Scrollbars

- **Hidden by default; visible only while that area is scrolling**, hiding again about 0.9s after scrolling stops.
- `src/hooks/useAutoHideScrollbars.js` adds an `is-scrolling` class to whatever scrolls; the theme makes scrollbars
  transparent except under `.is-scrolling` (`scrollbar-color`, with a WebKit fallback for older Safari).

## 12. Screen-specific decisions

- **Audit log:** the flag filters (Override, Recorded offline, Manual pending reconciliation) are **checkboxes**. They
  combine: an event shows if it has any ticked flag; with none ticked, all events show.
- **Billing:** totals are computed from the bill lines (don't copy the spec's inconsistent sample total). Bank fallback
  payments stay pending until a *different* officer confirms them; the recorder's own Confirm button is disabled.
- **Inbox:** you can't approve your own request ("Your request" label instead of buttons). Approve/Reject require a reason.
- **Posting:** bays that break an active (symmetric) separation rule or zone category are marked "not allowed".
- **Warehouse layout:** remove/shrink/re-grid is refused while a zone holds cargo, with the reason shown.
- **Roles (demo switcher):** the profile menu in the top right has a *Role* section (Super-Admin, Admin, BLPA
  Manager) with a tick on the current role; the role's name replaces the job title under the user's name. Roles and
  the screens each one can open live in `src/RoleContext.jsx` (`paths: null` = every screen, `hidden` = screens taken
  away). Super-Admin is the default and sees everything; Admin sees everything except Port setup; BLPA Manager sees only Home, Dashboard and
  Border gate. The left navigation, the Home shortcut tiles and Home's "Review inbox" button hide what the role can't
  open, and empty nav groups disappear. Opening a hidden screen by URL goes back to Home. The choice is remembered in
  the browser. Add future roles (Border Gate Manager, Warehouse Manager, …) to the `roles` list.
- **Port setup:** ports are **compact tabs** (status dot · name · code), not cards, so the page focuses on the selected
  port's details. The tab row scrolls sideways when ports don't fit. Status dot colours: green Live, blue Awaiting
  approval, amber Setting up. The selected port's status label, readiness % and progress bar sit at the top of the
  steps panel. Switching tabs returns to step 1.
- **Gates:** departure checklists block exit on holds, unpaid balance or an invalid pass. Admitting asks for confirmation.

## 13. Working on this repo

- After a change, verify in a browser at the sizes above (no page-level sideways scroll, nothing spilling out of
  cards, main flows still work: admit truck, weigh, approve in Inbox, record bank fallback).
- Commit, then push to `main`. GitHub Pages redeploys automatically
  (https://rms1585.github.io/IBMS-Redesign/); pushing a `v*` tag builds desktop installers into a GitHub Release.
- After a deploy, hard-refresh (Ctrl/Cmd + Shift + R) to see changes.
