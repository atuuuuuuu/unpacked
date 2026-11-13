# Security policy

Unpacked's core promise is that your data never leaves your device, so we treat privacy bugs as security bugs.

## What counts

- Any way for data from an export to reach a network request, storage the user didn't opt into, or another origin
- A way around the Content Security Policy
- A crafted export that crashes the tab, hangs the worker, or uses unbounded memory despite the size limits in
  `src/core/sources.ts`
- Script injection through export contents (names, titles, usernames)

## Reporting

Please **don't open a public issue**. Use GitHub's
[private vulnerability reporting](https://github.com/atuuuuuuu/unpacked/security/advisories/new) for this repository.
Include steps to reproduce and, if relevant, a **synthetic** file that triggers the problem. Never send a real export.

You can expect an acknowledgement within a week. Fixes for confirmed issues are released as soon as they're ready and
credited in the release notes unless you'd rather stay anonymous.

## Supported versions

Only the latest release on `main` is supported. Unpacked is a static site, so updating means reloading the page.
