# IBMS Redesign — Design Notes

The rules and small decisions this app follows. Several of them were explicit requests after review,
so keep them unless the product owner changes them. When you change one, update this file in the same commit.

---

## 1. Source of truth

- **Figma file:** `IBMS` (file key `sdIfB3NDRRRENCUi2MfLfU`). The design system lives on its *Design System* pages
  (Color & Typo, Button, Text Input Field, Search, Top Nav Bar, Alert, Table, Tabs, Dropdown, Tag/Chips/Status,
  Dialog, Other Component).
- **Never change anything in the existing Figma design system.** Read from it only.
- **Every design follows the style guide** (`public/style-guide.html`, live at `/style-guide.html` on the preview):
  colours only from theme tokens, text only from the type scale. A new size, weight or colour needs the product
  owner's OK and goes into the theme and the guide first, never into a page.
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

Plates, manifest IDs and references use a monospace font: `fontFamily: 'monospace'` resolves to the theme's
`typography.monospace` stack (SF Mono, Menlo, Consolas by platform). Give it a size from the scale above.

- **Use only the scale.** No other font sizes or an 800 weight in pages; use `typography: '<variant>'` in `sx`.
- **Exceptions:** collapsed-nav labels and badges are 10px (caption clips in the 88px rail); the Weighbridge live
  reading is fluid, 32–56px; KPI card values are h3 that shrinks with the card, down to 16px.
- **White and black** come from `common.white` / `common.black`, never `#fff` / `#000`.
- `public/style-guide.html` shows these colours and styles; update it in the same commit as the theme.

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
- **A button must look like a button (#66).** Any action sitting in running content — inside an alert, a camera card,
  a card header or a page header — is outlined (`variant="outlined"`, `color="inherit"`, or `color="error"` for a
  destructive one), never a bare text button. This covers Check again, Re-read plate, Check position again, Raise
  requisition, Enter manually, Posting's header links, and the Warehouse layout and Platform setup card actions.
  Text buttons stay only as table row actions (Edit, View details) and dialog Cancel/Previous; green text links stay
  for navigation and fill-in shortcuts (Move all, Deliver all).
- **Alert buttons wrap:** an alert's button moves under the message when the message would get narrower than 200px
  (theme rule on `MuiAlert`), so a narrow record column never squeezes the message into a thin strip.

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
- **A drawer never scrolls sideways.** Only a table may, inside its own area: wrap any table in a drawer in
  `TableScroll` (`src/components/common.jsx`). Drawers keep `maxWidth: '100vw'` so they fit a phone.
- **Text columns are left-aligned; figures are right-aligned** (amounts, weights, counts), as M2 Annex 24 sets and
  `ResponsiveTable` does. Figures never wrap; descriptions take the extra lines. Row actions sit at the right.
- **On a phone every table becomes cards** (`RowCards` in `src/demo/ui.jsx`, used by `ResponsiveTable` and
  `DataTable`), so nothing scrolls sideways. A row that opens something is a keyboard stop with a chevron.
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
- **Header:** paddings shrink on small screens; lookup and port sit at the left, bell, full screen and user at the right; a Beta tag sits beside the logo in the navigation (2026-11-25, replacing the header's environment tag); the full-screen button hides below 600px; the user's
  name hides below 900px (avatar stays).
- **Content area** is a named size container, `main`. Layout breakpoints use `@container main (…)` queries, so they
  respond to the space actually available with the navigation open or collapsed.
- **Workbenches** (Border gate, Inland gate, Weighbridge, Posting, Warehousing): **queue, record and camera/details
  columns stay side by side down to tablet width.** Never move the third column under the record there.
- **Benches** (`Bench` in `src/demo/ui.jsx`: Border gate, Inland gate, Weighbridge, Posting, Warehousing) size their
  columns from the content area (`@container main`), so an open navigation counts: three columns from 860px of
  content (side columns shrink first), queue + record with the checks card below from 600px, stacked below that.
  The record card is a size container; its hero plate scales from h3 down to h5 and Facts drop to fewer per row.
  - **Phone exception (user decision 2026-11-25):** when the content area is 600px or narrower the columns stack:
    queue (no longer sticky, list capped at 280px), then record, then camera/details. Three columns cannot fit a phone.
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
  stacked inside one column keep their natural heights.
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
- **Phase 1, pre-arrival and IGM** (from the 28–29 Oct 2026 stakeholder minutes; report: *IBMS Phase 1 — Pre-arrival
  and IGM: Design Report*):
  - At land ports Customs usually keys the IGM only when the goods reach zero point. A consignment expected before
    its IGM uses an IBMS **pre-arrival reference** (`PA-…`) and shows **No IGM yet**.
  - **C&F portal → Trucks:** the agency adds, edits and removes foreign trucks (vehicle number, driver, truck class)
    per manifest or pre-arrival reference. A truck is locked once it enters the port. A new or edited truck is
    **Entered by C&F** until Customs validates it; changing a validated truck sends it back for validation, and
    "Save changes" stays disabled until a field actually changes. The truck class field shows the demo entrance and
    weighing rates for that class once one is picked. Class sets the entrance and weighing charges (F8); the rates are
    demo values in `truckClassRates` and the classes themselves still need BLPA's confirmation.
  - **Border gate:** admission is blocked until the IGM is received *and* Customs has validated the truck details.
    "Check again" stands in for the BNSW status update in the demo. A camera mismatch still only warns.
  - **Perishable** trucks carry an amber label with a timer icon, in the queue and on the record.
  - Behaviour that rests on an open decision carries an `AssumptionNote` (amber "Assumption · F-number" label +
    one line), so reviewers can tell it from agreed behaviour. Remove the note once the decision is made.
- **Phase 2, Car Pass and foreign dispatch** (consultation minutes, item 4 and F11):
  - The Car Pass stays on paper. IBMS has no digital Car Pass.
  - C&F agents never upload or photograph a Car Pass. BLPA receives it from Customs.
  - A missing Car Pass never blocks Admit, because Bhomra doesn't fully use one. The C&F drawer and the border gate
    only carry a one-line note.
  - No screen asks for the immigration paper or token.
  - India's Car Pass and manifest data stays a future option, with no placeholder screen until an agreement exists.
- **Phase 3, zero point and entry** (consultation minutes, item 5 and F13):
  - Customs enters before BLPA. The border gate's Admit stays blocked until Customs has keyed the IGM and validated
    the truck.
  - BLPA does not re-key truck or cargo details at entry. Admit confirms data that arrives through BNSW and from the
    C&F agent. The only hand entry is *Register unexpected truck*, which is flagged for management review.
  - No truck is weighed before it has passed the entry gate; each checkpoint needs the previous one complete.
  - No screen asks for the LC number at entry.
  - The border gate charges the entrance fee on the truck class Customs records at zero point. The C&F agent's class
    is advance information; a difference is flagged on the record, not charged.
- **Phase 4, weighing** (consultation minutes, item 6, F16 to F18):
  - Weight capture, manual entry and confirmation stop until the plate read matches the expected truck, the truck has
    passed the entry gate, and the bridge camera shows the whole truck inside the marked area.
  - The weight-tolerance flag against the declared weight is information only. It never deducts weight or changes the
    scale reading; the figure (proposed 5%) waits on BLPA and Customs.
  - The weighing charge follows the truck class Customs recorded, like the border gate fee; a different C&F class is
    flagged, not charged.
  - Every confirmed weight is written to the audit log against the user. A manual weight needs a reason and is flagged
    Override and Manual pending reconciliation.
- **Phase 5, routing to yard / shed** (consultation minutes, item 7, F19 to F23):
  - Posting is a proposal: the posting officer picks bays by volume (m³) and goods type, the warehouse in-charge
    accepts or rejects, and a rejection goes back to the officer with the reason.
  - One truck can carry several consignments. Each product is its own posting line, checked against its own
    category's storage rules and posted to its own zone; the record lists every consignment on the truck and its stage.
  - Accepting a posting alerts the C&F agency in its portal with every drop point (facility, bay, m³), so the agent
    can call the driver. The acceptance is written to the audit log.
  - Stone and cotton cannot be unloaded in the port. At posting they get an outside-yard route instead of the bay
    grid: the yard, who carries it (the Indian truck, or Bangladeshi trucks counted, not recorded by plate) and an
    outing fee per trip. Who approves the route waits on BLPA (F62), so the posting officer routes it in the demo and
    the audit entry is flagged Exception. The outing fee is a demo rate.
  - Vehicle fitness is shown by source and is a warning only (F19, #45). BRTA covers Bangladeshi trucks: the inland
    gate shows the BRTA status and warns when it is expired or unfit, and admitting still goes ahead. Indian trucks at
    posting show "No record: Indian-registered, BRTA does not cover it", never an invented status.
  - Only BLPA changes a manifest's C&F agent, from Manifest tracking, with a written reason (#46). Licensed agents
    for the port are offered; an expired licence can't be picked. The change is kept on the manifest, written to the
    audit log, and both agencies are alerted; the C&F portal follows the new agent.
  - A posting line whose goods description does not name the goods ("and others", "etc.", "miscellaneous") shows a
    "Description incomplete" warning in the queue, at posting and to the warehouse in-charge (#47, F22). Warning only:
    storage rules are checked against the guessed category, and the lasting fix is the NBR rule in #48.
  - Open: product data through BNSW (#48) and the terminal master plan (#49).
- **Phase 6, yard / warehouse and Bill of Entry** (consultation minutes, item 8, F24 to F29):
  - A truck reaches Warehouse receipt when the warehouse in-charge accepts its posting (#51). Posting, Warehouse
    receipt and Labour requisitions share one store (`src/WarehouseContext.jsx`).
  - Unloading starts only when the handheld plate read matches the expected truck (#52), as at the weighbridge.
  - The shed raises a labour requisition; the contractor and labour union assign the gang and the equipment sent.
    The in-charge never picks a gang. Start unloading waits for an assigned gang, and the record shows the
    labourers the contractor named and any equipment that differs from the request (#53). How the contractor or
    union confirms is open with BLPA (#60).
  - The receipt splits its weight between hand and equipment and counts lifts per equipment item. Crane plus
    forklift is double handling, billed twice. Lifts from the contractor's device are shown as such and locked;
    the rest are entered by the in-charge (#54).
  - The receipt weight is the higher of the declared and weighbridge weight, Benapole's rule, labelled as an
    assumption until BLPA confirms it for every port (#55). The unloaded quantity stays as the physical count.
  - The Bill of Entry number and Customs channel show at the shed. Yellow and red channel goods carry an
    examination notice so the shed keeps them reachable; it is a demo BNSW status until NBR confirms (#56, #61).
  - Goods moved inside a shed are recorded with from and to bay, tonnes and a reason; a per-tonne fee (demo rate)
    is charged to the owner of the goods moved and written to the Audit log (#57).
  - The monthly contractor bill is computed from completed requisitions: tonnes by hand and with equipment, double
    handling and lifts, at demo rates (#58).
- **Phase 7, transshipment and perishables** (consultation minutes, item 9, F32, F62):
  - Transshipment works from a queue of work orders, one per source truck. Perishables come first, then the longest
    wait, and each shows how long it has waited (#62).
  - Receiving trucks are only those the C&F agent registered for the manifest that have entered at the inland gate;
    the order shows registered, entered and in-use counts (#63).
  - Each transfer needs the handheld plate read to match the receiving truck, records the kg moved, can't exceed the
    remaining weight, and is written to the Audit log (#64).
  - Labour comes from a Transshipment requisition, as at the shed. Finishing a work order records the handling split
    and completes the requisition, which feeds the contractor bill (#65).
  - Non-perishables go across only with Customs' permission: transfers stay stopped until it is Granted. It is a demo
    BNSW status until NBR confirms (#66, #69). Products & routing warns when a non-perishable is routed to
    Transshipment.
  - Truck-to-truck transfer when sheds are jammed is its own work-order type (#67). It and non-perishable
    transshipment are billed as unloading plus loading (two handlings); true transshipment of perishables is one.
    The rate is a demo value, and who declares sheds jammed waits on BLPA (#70). Both exceptions are flagged
    Exception in the Audit log.
- **Phase 8, foreign truck exit** (consultation minutes, item 10, F16, F30, F31). One truck-weight record
  (`TruckWeightsContext`) is shared by the Weighbridge, the Border gate, the Inbox and the C&F portal:
  - A foreign truck can't leave until its tare is valid. A missing or expired tare, or an open re-weigh order, blocks
    departure and puts the truck in the Weighbridge's Empty & returned queue. The empty weighing becomes the new tare
    and clears the block. Trucks emptied at a shed or in transshipment join the gate's Leaving list (#71).
  - The border gate releases a foreign truck on a plate scan matched to its entry record. A mismatch blocks it, with
    Re-read plate. No image comparison: BLPA staff have no time for it at the gate. Departures go to the Audit log, and
    the Car Pass stays with the driver (#72). The Border gate lists foreign trucks only; the inland gate, local ones.
  - Tare validity is the interval set in Port setup (default 3 months). Age counts from the last empty weighing (#73).
  - BLPA or Customs can order a re-weigh at any time, with a reason. The weighbridge is told through the header
    notifications, and the truck can't leave until weighed empty. Who may order is an assumption (#74, #78, #79).
  - A C&F agent applies for an early re-weigh from the manifest, with a reason. The Customs AC and the BLPA AD each
    decide in the Inbox, with mandatory remarks; both approvals create the re-weigh order, one rejection closes it, and
    the C&F agency is told. In the demo one person decides for the pending authority (#75, #78).
  - The weighbridge record shows the truck's tare history. A new tare more than 300 kg below the last is flagged
    Exception in the Audit log for information only; nothing is blocked. 300 kg is a demo figure until BLPA decides
    (#76, #79).
- **Phase 9, assessment, duty and Customs release** (consultation minutes, items 11 and 2, F5, F45). BLPA takes no
  Customs decision; it acts on the result:
  - One Customs status per consignment (`CustomsContext`) is read by Manifest tracking, the C&F and Importer portals,
    Warehouse receipt, both gates and the Exit pass, so no two screens can disagree. Its steps: Bill of Entry filed
    (with its channel), Examined for Yellow and Red, Assessed, Duty paid, Released; a hold can stop any step. Each
    step arrives through BNSW; in the demo the manifest's Customs tab has buttons that stand in for it (#80).
  - Screens show each step with its time and source, never the duty amount: BLPA needs signals, not confidential
    Customs data. Released covers every agency certificate, so BLPA checks nothing else (#81).
  - A release or a hold alerts the C&F agency and appears in the header bell, and goes to the Audit log (#82).
  - The Exit pass takes Customs' release as its Customs approval; no Customs officer signs in IBMS. The shed in-charge
    and the C&F signer still sign, and the pass can't be issued before the release or during a hold (#83, F45).
  - If BNSW sends nothing, an officer records the release from the paper Release Order number. A second officer
    confirms it in the Inbox, the maker can't confirm their own, and the step shows "From paper" everywhere (#84, F5).
- **Importer / exporter portal (#50):** each manifest row has View details, opening a read-only page with the summary,
  what still stops the manifest from closing, its trucks and Pay now for a balance due (minutes, item 14: the importer
  can pay the BLPA bill). Operational actions stay with the appointed C&F agency.
- **Posting is a proposal (F21):** the posting officer picks bays and splits the cargo by volume; the warehouse
  in-charge accepts or rejects it. IBMS shows free space in m³ and marks rule breaks, and people decide.
- **Weighbridge (F17):** weight capture, manual entry and confirmation stop until the truck has passed the entry gate
  and the camera plate matches. "Re-read plate" stands in for a corrected camera read in the demo.
- **Screens added from the consultation backlog:** Labour requisitions (F24), Exit pass (F45), Part delivery (F39, F40),
  Cargo vehicle terminal (F23), Auction and destruction (F28, F29), Export (F49, F50), Rail cargo (F51), Passenger
  (F52–F54), Exception catalogue (F62), Truck queue (F34), and local truck booking in the C&F portal (F32, F33, F35).
  Anything resting on an open decision carries an `AssumptionNote`.

## 13. Working on this repo

- After a change, verify in a browser at the sizes above (no page-level sideways scroll, nothing spilling out of
  cards, main flows still work: admit truck, weigh, approve in Inbox, record bank fallback).
- **M2 work goes to the `dev` branch. `main` stays frozen**; don't push or merge to it without the product owner's
  explicit go-ahead.
- **`dev` is the live preview:** every push to `dev` deploys to https://rms1585.github.io/IBMS-Redesign/ through
  GitHub Pages (2026-11-25; it replaced the Blocks hosting, sign-in and shared storage). Anyone with the link can
  open it; each viewer's edits stay in their own browser.
- `redesign-v02` is previewed at https://rms1585.github.io/IBMS-Redesign-v02-preview/. That repo holds only the
  built files: run `npm run build` and push `dist/` to its `main` branch after each change.
- Pushing a `v*` tag builds desktop installers into a GitHub Release (from `main` only).
- After a deploy, hard-refresh (Ctrl/Cmd + Shift + R) to see changes.

## 14. M2 realignment (branch `dev`, cards #88–#110)

The prototype now follows the M2 report and its annexes. Where these notes disagree with M2, M2 applies
(Annex 24: "where it differs from the report or the standard, the prototype is wrong").

- **One operating record** (`src/demo/PortStore.jsx`): manifests and lines, truck visits (one visit carries
  every manifest on the truck), Bills of Entry with releases and per-truck exit notes, named holds, Delivery
  Requests, Exit Passes, bills and an event log with the source of every value. Kept in the viewer's browser
  between pages and reloads, never shared; "Reset demo" in the user menu restores the seed (`src/demo/seed.js`).
- **BNSW simulator** (External status, M-14): the only demo tool. Sends manifests, releases, exit notes and
  holds, and takes BNSW or the exit check down.
- **Roles** are the Annex 8 template roles, each with a named person who signs what the role does.
- **Interface standard** (Annex 24) is in the style guide: five status tones, source markers, YYYY-MM-DD 24-hour
  dates, plates in plain bold, in-place editing, no sideways scrolling, the fixed bench layout, Bangla and English.
- **Replaced:** Part delivery by the Delivery Request (M2 3.4.10), Truck queue by the holding area (3.4.5), the
  Exit pass screen by the inland gate's Exit Passes (3.4.11). Their old routes redirect.
- **Removed (2026-11-24, with the user's OK):** the replaced pages (Trader manifest, Part delivery, Truck queue, Exit
  pass), their components and the old per-area stores (`src/*Context.jsx` other than Role and ColorMode), plus the
  mock data only they used. Earlier sections that name those stores describe the redesign-v02 prototype.
- **Settled by M2 against earlier decisions:** the Customs ARO signs the Exit Pass again (C1); paper release is
  BNSW-down mode at the revenue desk (C2); examination is not tracked (C3); release runs per Bill of Entry (C4);
  holds belong to the body that placed them (C5); the tare rule is national (C11).

## 15. M2 compliance (2026-11-25)

The product owner ruled that M2 (report and annexes) is the updated requirement and overrides earlier decisions,
with one exception. Source: M2 compliance audit, `~/IBMS Audits/M2-compliance-audit-2026-11-25.md`.

- **Kept against M2 (product owner's decision):** create forms open in a drawer from the right (`FormDrawer`),
  although Annex 24.4 asks for in-place panels. Edits of existing records stay in place. Treat this as a change
  request to Annex 24.
- **D2 / A1, A2:** EXC-12 and EXC-13 are withdrawn. Only perishables go truck to truck; Products & routing refuses
  Transshipment for anything else. The Exception catalogue is replaced by the read-only Annex 3.5 register
  (`src/data/exceptions.js`, EXC-01 to EXC-38 without 12 and 13). The Phase 7 notes about non-perishable
  transshipment and jammed-shed transfers in section 12 no longer apply.
- **D3 / A3, A4:** every passenger pays; passenger categories record assistance, never an exemption. Phone numbers
  take a country code.
- **D4:** Auction and aging is a view of Warehousing ("Aging and auction"), the cargo vehicle terminal a view of
  Posting, and Export a view of the Inland gate. None is in the module index; old links open the view.
- **D5:** the "Demo presenter" role is labelled as a demo aid, not a live role.
- **A6:** Equipment & labour holds categories and how each is charged (no prices, no named gangs), an
  unavailable/available action with a reason, and an upload with a row-by-row check.
- **A7–A11:** Customs manifest numbers everywhere; status words beside colours; "Send for approval", never
  "Submit"; a plain notice instead of a silent redirect; no green background behind text on Home.
- **Step 2, interface standard (Annex 24):** top bar keeps M2's order: lookup and port on the left (product owner's
  decision), then language, bell, full screen and user on the right (language also stays in the user menu for phones). Drawers ask before discarding typed input
  and the browser warns on leaving; a disabled main action shows its reason beside it. Bay and terminal-slot
  details show in a line under the grid, not only in tooltips. `prefers-reduced-motion` makes every transition
  instant and charts skip animation. Buttons and inputs are 48px tall and icon buttons 44px on a phone. Dashboard
  > Reports shows skeleton loading and the system-error state with a help-desk reference, and records downloads.
  Contrast: bell badge and filled error messages use Error Dark, filled success messages Success Dark, table
  headers grey 700, outlined labels the text shade.

- **Step 3a, settings drive operations (B18):** `effectivePort()` and `effectiveTariff()` in `src/demo/PortStore.jsx`
  read Port setup's per-port module switches and weight tolerance, and the tariff order head office activated.
  Switching a module off removes its screens from the menu and Home and shows a notice on its address; Products
  & routing and Posting follow the warehousing and outside-yard switches; the Inland gate's Export view follows
  export storage. The weighbridge uses the port's tolerance. Platform setup > Tariff orders: a recorded draft
  gets its rates entered and is activated; new bills use the active order, and What this port charges shows the
  rates bills use now. Still local to their screens: vehicle classes, storage rules (enforced in step 4, B5),
  users and roles.
- **Step 3b, manual procedure and back-entry (B13; Report 4.16, Annex 7.13, 24.10):** Access and control >
  Outage and back-entry (`src/pages/Outage.jsx`). The BNSW simulator's "Connection to NDC Agargaon" drops the
  primary link (amber "Reconnecting" strip) or both links (red strip that also says sign-in fails), and restores
  the link. The port in-charge declares the manual procedure, then recovery (amber strip on every screen), then
  normal working, which is refused while the three counts (forms used, entered with void, checked) differ or a
  class D/E case has no owner. Back-entry refuses numbers outside the port's pre-issued range or already entered,
  orders by the event time on the form, holds first, and needs a second person to confirm. Exceptions are sorted
  into classes A–E (A duplicate logged, B one match linked, C adjustment bill raised, D hold wins, E security
  incident referred to Customs and BLPA, never closed as a correction). Missing form numbers and the
  reconciliation report are their own tabs. The demo has no sign-in page, so the red strip carries that notice.
- **Step 3c, dashboard indicators (B10; Annex 11):** `src/data/indicators.js` holds all 42 Annex 11 indicators
  (Performance 14, Revenue 8, Resources 7, Control and security 13) with definition, source, owner, baseline,
  per-port demo values and the same period last year. Dashboard > Performance, Revenue, Resources and Control
  show them as cards with a "How it's calculated" panel; Benapole figures the record can compute are marked Live.
  A Benapole / Bhomra / Burimari / All ports switch sits beside the period. Every chart has an "In words" line.
- **Step 3d, inland gate exits (B1; Annex 3.7 Table 31, 7.10):** Inland gate > Other exits handles receiving
  trucks for a transfer (they cannot leave before the foreign truck), loaded export trucks against the Bill of
  Export (a cancelled one is refused), stone trucks to the outside yard (exit note or written controlled-movement
  proof; follows the outside-yards switch), empty export trucks after the return fee, returned export trucks on a
  return-inland pass, and self-driven vehicles off a train (follows the rail switch). Every exit also checks for a
  hold or BGB stop. When the plate reader fails, staff type the plate with a reason (EXC-01) and the check still
  runs. Local trucks on an Exit Pass stay on Exit lanes.
- **Step 3e, C&F portal flows (B7):** the portal has Open and Closed consignment lists, an Exports tab (enter an
  export truck against a road Bill of Export, or send the wagon list for a rail one; a cancelled Bill of Export
  refuses both) and a Re-export tab (a declaration that differs from its temporary-import lot is flagged, EXC-38).
  On a consignment: a truck admitted on its Car Pass before the manifest arrived waits until the agency enters its
  plate (BNSW no longer ties it automatically); perishable lines get a transfer request with up to three
  receiving-truck plates; documents are uploaded and their fields shown against the record (the demo misreads the
  weight on purpose); "Download the record" saves a CSV of the consignment. All actions are refused while the
  agency's licence is not valid. Bangla for these new screens is still to do.
- **Step 4 batch 1, gate, weighbridge and posting (B2–B4):**
  - Border gate:
    - "Plate read at the lane" shows a short list to pick from when the plate matches several expected trucks.
    - A plate that already has an open visit is a hard stop (EXC-03).
    - "Vehicle with no plate" parks the vehicle under its Car Pass number until BLPA rules on it (EXC-30).
    - In BNSW-down mode the gate keys the Car Pass manifest lines for a late truck. Admission waits on those lines.
    - The action bar of every bench sticks to the bottom of the window, so "Admit truck" is in view at 1366×768.
  - Weighbridge:
    - The supervisor ties each unmatched raw reading to a visit or voids it, with a reason.
    - The stone weigh-back weighs the empty truck back from the unloading zone before any top-up bill. It is a
      preview for Bhomra and Burimari: the stone route stays disabled until NBR and BLPA decide its control.
  - Posting:
    - A truck whose lines take different routes shows its drop points in order. The transshipment bay comes last.
    - Posting staff can send a truck back down the queue or escalate it to the supervisor, each with a reason.
    - A place whose storage rule does not take the goods category blocks the posting until the supervisor
      overrides it with a reason.
    - Demo manifest 2026/601/08886 now has a second line (cast-iron parts) to show two drop points.
- **Step 4 batch 2, warehousing, transshipment and billing (B5, B6, B9):**
  - Warehousing:
    - A shortage or damage at receipt needs a photo before the receipt locks, and Custody shows it on the lot.
    - The shed requisitions equipment from the port's list. A machine marked unavailable cannot be chosen.
    - Custody shows aging flags: flagged at 30 days, referred to the port in-charge at 60. These are demo limits
      until batch 4 adds them to Port setup.
    - A shift records the place, the lifts, the reason and the owner. A blocked bay is refused outright, and a bay
      whose storage rule does not take the goods needs the supervisor's approval.
    - Recording a disposal needs the disposal decision reference.
  - Transshipment:
    - Each receiving truck's Exit Pass is approved for the goods it took.
    - The warehouse manager enters each transfer's start and end times. The end may not come before the start.
    - Damaged, short or refused cargo is raised as an exception, and the agency is told.
    - The request cannot close while any balance is unexplained.
  - Billing has three new tabs:
    - Supplementary bills and credits: raised from resolved reconciliation cases and approved by a second person.
    - Customs decisions by reference: temporary-import terms, disposal and dues settlement.
    - Finance: collections by channel, bills raised against payments received each day, and payments that did
      not arrive.
- **Step 4 batch 3, inbox, roles, access and audit (B11, B12, B14–B16):**
  - Start page: the supervisor, port in-charge, bill approver and head-office approver start on the Inbox only
    when something waits for them. Otherwise they start on their usual screen (`src/demo/inbox.js`).
  - Inbox:
    - Four tabs, each with a count: Approvals, Needs attention, Reconciliation and Alerts.
    - Reconciliation lists back-entry exceptions, values keyed while BNSW was down, and payments that never
      arrived.
    - Alerts are newest first and marked unread, with a choice of alert types to follow.
  - Approvals:
    - A correction is approved only after a signature drawn on the device and a six-digit second-factor code.
      The decided item shows the signature image.
    - Approvals also takes override requests with a reason. The six never-overridable acts are listed but refused
      for every role.
    - The person who asked for an override never sees Approve.
  - Roles: the demo role switcher and the role templates gain the eight missing roles: TR-03, 08, 10, 11, 18,
    19, 20 and 27. The Finance officer starts on Billing > Finance. The roles list in the demo record is renamed
    `rolesV2` so the new templates show.
  - Users:
    - "Upload staff list" checks each row (name, email, duplicate account, role, port) and imports only the good
      rows. A demo file is built in.
    - "Add role assignment" refuses role pairs that must stay with different people: Billing officer and Bill
      approver, Revenue configurator and Head-office approver, Access administrator and Head-office approver.
  - Audit log:
    - Filters for person, role and period, and "only keyed, typed or back-entered values".
    - Export first shows a notice. The export itself is written to the audit trail, with the filters used.
- **Step 4 batch 4, the last batch (B8, B17, B19–B22, Bangla):**
  - Port setup has a new step, "Rules and limits", saved per port in `src/demo/portRules.js`. The benches read it:
    - The "Other" manifest switch. With it off, the gate refuses BNSW-down keyed lines and the truck waits.
    - Optional fields: driver mobile and truck colour at the border gate, seal number at the weighbridge.
    - Holding-area places and call time, shown on Posting.
    - Aging limits, used by Warehousing > Custody.
    - Approval time limits with night delegates.
    - Open-record limits with owners.
  - A tariff order now needs its legal reference (SRO or gazette notice). Reading a scanned tariff is not built.
  - Rail:
    - A train arrival is keyed in BNSW-down mode and marked keyed.
    - A notice releases the empty wagons.
    - Export wagons are loaded and sealed per wagon.
    - The hand-over is refused without every wagon loaded, Customs' release, the bill paid and no hold. The
      departure closes the record.
  - Licences: a renewed licence needs a copy and the licensing authority's reference. Both show as evidence.
  - Labour:
    - A Workers tab holds profiles and card status.
    - Attendance has a demo card reader. It refuses unknown cards, blocked cards and a card already in use.
    - A worker can be marked present without a read only with a reason, and the record shows "By hand".
  - Importer portal:
    - "Download the record" on each consignment.
    - "Can't find your consignment?" raises a BIN mismatch case to Customs when the manifest names another
      importer.
  - The Customs workspace for BGB and Immigration has a Passengers tab: fee receipts and whether each ticket was
    used at the checkpoint.
  - Bangla: 150 strings already set up for translation got Bangla, including every C&F 3e string. Many headings
    and help texts added in step 4 are still plain English in the code and are not translated yet.
- **Step 4 Bangla pass:**
  - The fixed text on the step 4 screens is now set up for translation and has Bangla: about 435 strings, on top of
    the 150 from batch 4. That covers headings, help text, labels, buttons, table columns, checks, the bench context
    strip, Billing tabs, Port setup steps, the override rules and the disabled-action reasons.
  - `Bench` and `Checklist` now translate their context labels and check descriptions.
  - Still in English on purpose: record data (names, plates, goods, audit entries) and sentences built with live
    values, such as "4,000 kg is left unexplained".
