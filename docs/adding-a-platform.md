# Adding a platform

Each platform is self-contained. Adding one touches one new folder and three small registries. Use
`src/platforms/instagram/` as a compact reference.

## Before you start

- **Use a real export.** Request your own and look at its structure. Never commit real exports. `*.zip` is already
  ignored, and tests use synthetic fixtures.
- **Check there's something worth showing.** A good platform answers a question people actually have: "What did I watch
  most?", "Who doesn't follow me back?".
- Open a "New platform" issue first so nobody else starts the same one.

## 1. The parser (runs in the worker)

Create `src/platforms/<id>/` with:

| File           | Purpose                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `schema.ts`    | Zod schemas for one record. Make only the fields you use required; everything else `.optional()`, because platforms add and remove fields. |
| `types.ts`     | The summary your dashboard needs. Keep it small: aggregates and top-N lists, not raw records.                                              |
| `parse.ts`     | A `PlatformParser<'id'>` with `select`, optional `diagnose`, and `parse`.                                                                  |
| `sample.ts`    | A generator for fictional data in the **real file format**, using `rng(seed)` from `core/random.ts` so it's deterministic.                 |
| `<id>.test.ts` | Tests for `select`, `diagnose`, `parse` (including bad records) and the sample.                                                            |

```ts
export const netflixParser: PlatformParser<'netflix'> = {
  id: 'netflix',
  // Pick files by path. Return [] when this isn't your platform.
  select: (paths) => paths.filter((p) => /(^|\/)ViewingActivity\.csv$/i.test(p)),
  // Explain near-misses, e.g. a related export without the file you need.
  diagnose: (paths) =>
    paths.some((p) => /Netflix/i.test(p)) ? 'Request “Viewing activity”.' : null,
  parse(files, ctx) {
    // Validate each record with Zod, count the ones that don't match in `skipped`,
    // throw ImportError('format-changed', message, structureReport(...)) if nothing matches.
    return { summary, skipped }
  },
}
```

Rules:

- **Never keep data you don't show.** Zod drops unknown keys; make sure the summary has no IPs, emails or message text.
- **Don't invent numbers.** If the export doesn't contain something, say so in the UI instead of guessing. If you must
  estimate (like YouTube watch time), label it and explain the method on the dashboard.
- **Use local time** via `core/time.ts` for any hour, day or weekday bucketing.

## 2. Register it

1. Add the id to `PlatformId` and `SummaryByPlatform` in `src/core/types.ts`.
2. Add the parser to `src/platforms/parsers.ts`.
3. Add the sample to `loadSample` in `src/core/import.ts`.
4. Add metadata and the export guide (steps, notes, what to request) to `src/platforms/ui.tsx`.

## 3. The dashboard

Create `src/pages/dashboard/<Name>Page.tsx`, following the existing pages:

- Use `pickView(datasets, '<id>', view)` and render `<EmptyDashboard platform="<id>" />` when nothing is loaded.
- Start with `DashboardHeader`, then a row of `Stat` tiles, then `Panel`s with charts from `src/components/charts/`.
- Add a share card (`ShareButton` with a `CardSpec`).
- End with a `Footnote` that explains how numbers are counted.

Register the route in `src/App.tsx` (the `DASHBOARDS` map and the route patterns).

## 4. Tests

- Unit tests next to the parser (`npm test`).
- Add a fixture to `e2e/global-setup.ts` and an upload test to `e2e/upload.spec.ts`.
- Run `npm run check` before opening the PR. It covers lint, types, unit tests, build and e2e on desktop and phone.
