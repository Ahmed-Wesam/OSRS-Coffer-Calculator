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

---

# Caching design (future)

This section documents a future caching architecture so we can safely switch from GE Tracker parsing to “real API” sources without performance or throttling issues.

## Goals
- Keep the UI fast (initial table render in seconds).
- Avoid being throttled by upstream providers.
- Be resilient to transient failures (empty bodies, 429s, 5xx).
- Make data freshness explicit (timestamps + TTL).

## What to cache

### A) OSRS Wiki Prices API
- **/mapping** (item metadata: id/name/icon/buy limit)
  - **TTL:** 24 hours
  - **Why:** changes rarely, large payload, used for eligibility (GE limit > 0) and display metadata.
- **/latest** (real-time prices)
  - **TTL:** 60 seconds
  - **Why:** high-frequency, used for “buy price” if we move to Wiki prices.
- **/5m** (smoothed prices + volume)
  - **TTL:** 5 minutes
  - **Why:** optional smoothing for more stable “offer price” or sanity filtering.

### B) Official GE guide price (for true Death’s Coffer value)
**Preferred:** server-side cached snapshot.
- **Source:** Jagex itemdb endpoints.
- **Cache shape:** map of `{ itemId: officialGuidePrice }`.
- **TTL:** 6–24 hours (guide price doesn’t need 60s updates).
- **Fallback behavior:** if a fetch fails, serve last-known-good cached snapshot.

### C) Death’s Coffer eligibility list
We need a machine-readable eligibility set to accurately exclude:
- untradeables
- tradeables not offerable on GE
- bonds
- leagues/grid/deadman rewards
- specific exclusions (e.g. Sailing-related)

**Preferred:** server-side cached “eligible item ids” set.
- **Source options:** OSRS Wiki (category/Cargo/SMW) if available; otherwise curated list + periodic refresh.
- **TTL:** 24 hours

## Where to cache

### Phase 1 (client-side only)
- `localStorage` cache for:
  - OSRS Wiki `/mapping`
  - OSRS Wiki `/latest` (short TTL)

**Pros:** simple.
**Cons:** doesn’t solve Jagex throttling for official guide prices.

### Phase 2 (recommended for production)
- Add a small server layer (Node/Express or serverless function) that:
  - fetches upstream data
  - caches it (in memory + persisted file/kv store)
  - serves it to the React frontend via a single endpoint

**Cache tiers:**
- **In-memory**: fastest for repeated requests
- **Persistent**: file (JSON) or KV store so restarts don’t wipe the cache

## Cache envelope & invalidation
- Each cached entry should include:
  - `value`
  - `fetchedAt`
  - `maxAgeMs`
  - optional `etag`/`lastModified`

Invalidation strategy:
- Time-based expiry (TTL)
- Manual “refresh” button (optional)
- If refresh fails, continue serving stale-but-recent data (stale-while-revalidate)

## Rate limiting / backoff
- Global request throttling per upstream host.
- Retry with exponential backoff for:
  - `429`
  - `5xx`
  - empty/invalid JSON bodies

## Success criteria (when we revisit)
- Switching to OSRS Wiki + official guide price does not degrade load time.
- No more than a small bounded number of upstream requests per page load.
- The app works even if Jagex/Wiki temporarily rate-limits.
