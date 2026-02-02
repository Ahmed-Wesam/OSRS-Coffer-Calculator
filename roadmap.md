# Enhancement roadmap

This roadmap implements a set of UX and data-quality changes to the OSRS Death’s Coffer ROI app.

## Scope
We will do the following, in order:
1. Remove the search box.
2. Remove any item that can’t be used on Death’s Coffer.
3. Remove the sorting button and always sort from highest to lowest ROI.
4. Add minimum and maximum price filters with support for `k`/`m` shorthand.
5. Remove the row count and rename the reset button to “Reset filters”.

---

## 1) Remove the search

### Implementation
- Remove the `query` state and `<input id="q">` control.
- Remove the `.filter((r) => ...)` that checks `name.includes(query)`.

### Success criteria
- Search input is not visible.
- Table contents are not filtered by name.

---

## 2) Remove any item that can’t be used on Death’s Coffer

### Notes
Authoritative eligibility rules are complex (tradeable, not certain excluded groups, etc.). With the current data source (GE Tracker page), the pragmatic baseline eligibility check we can enforce is:
- Only show items where the **official GE price** is at least **10,000** (Death’s Coffer minimum value rule).

### Implementation
- Apply a filter `officialGePrice >= 10_000`.

### Success criteria
- No rows with `Official GE` less than `10,000`.

---

## 3) Always sort by ROI (desc) and remove sorting button

### Implementation
- Remove `sortDir` state and the sort toggle button.
- Always sort by `roi` descending after computing rows.
- Keep the table display order as highest ROI first.

### Success criteria
- Sort button is not visible.
- Rows are always ordered by highest ROI first.

---

## 4) Add minimum and maximum price filters (supports `k`/`m`)

### Requirements
- User can type `300k` meaning `300,000`.
- User can type `2m` meaning `2,000,000`.
- User can still type `2,000,000` (commas allowed).

### Clarification (what “price” means)
- We will interpret the filter as **Buy price** (offer price), since that’s the user’s cost basis.

### Implementation
- Add two inputs: `Min buy price` and `Max buy price`.
- Implement a `parsePriceInput()` helper:
  - trims
  - lowercases
  - removes commas
  - supports suffix `k` and `m` (optionally `b` if we want)
  - returns `number | null` (null when blank or invalid)
- Apply filtering:
  - if min is set: `buyPrice >= min`
  - if max is set: `buyPrice <= max`

### Success criteria
- Entering `300k` filters out rows with buy price < 300,000.
- Entering `2m` filters out rows with buy price > 2,000,000.
- Entering `2,000,000` behaves the same as `2000000`.

---

## 5) Remove row count and rename reset button

### Implementation
- Remove the “Rows: N” badge.
- Change button label from `Reset` to `Reset filters`.

### Success criteria
- No row count badge is displayed.
- Button text reads exactly: `Reset filters`.

---

## Final validation checklist
- App loads quickly (single GE Tracker fetch).
- Only ROI > 0 items displayed.
- Only `officialGePrice >= 10,000` displayed.
- Always sorted by ROI (desc).
- Min/max buy price filters work with `k`/`m` and commas.
- Search and sort controls removed.
- Reset button renamed and clears min ROI + min/max price filters.
