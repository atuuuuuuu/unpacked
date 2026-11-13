# Contributing to Unpacked

Thanks for helping. Unpacked is small on purpose, so contributions are easy to review. Here's how to make yours land
quickly.

## Ways to help

- **Add a platform.** The most valuable contribution. Read [docs/adding-a-platform.md](docs/adding-a-platform.md) and
  open a "New platform" issue first.
- **Report a changed export format.** Use the "Format report" from the error panel. It contains key names and types,
  never your data.
- **Fix bugs, improve accessibility, tighten copy.** Issues labelled `good first issue` are a good start.

## Ground rules

1. **Privacy is not negotiable.** No analytics, no third-party requests, no CDNs, no feature that sends data anywhere.
   The CSP and `e2e/privacy.spec.ts` enforce this; don't weaken either.
2. **Never commit real exports**, not even your own. Write synthetic fixtures (see the `sample.ts` files).
3. **Don't fabricate numbers.** If an export doesn't include something, the UI says so.
4. **Keep it lean.** Every dependency needs a reason. Prefer the platform and the helpers already in `src/core`.

## Setup

```sh
npm install
npx playwright install chromium
npm run dev
```

Before opening a pull request:

```sh
npm run check   # lint, types, unit tests, build, e2e on desktop and phone
```

## Pull requests

- One topic per PR. Describe what changed and how you tested it; the template has a checklist.
- UI changes: add before and after screenshots, in both themes and at phone width.
- New parser logic needs unit tests, including bad and missing fields.
- Commits: short imperative subject ("Add Netflix parser"), details in the body if needed.

## Code style

Biome formats and lints everything (`npm run fix`). TypeScript is strict with `noUncheckedIndexedAccess`. Write
comments only for the _why_. Write UI copy plainly: say what happens, and write errors that tell people how to fix
the problem.

By contributing you agree that your work is released under the [MIT License](LICENSE) and that you'll follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
