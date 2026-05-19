After making non-trivial changes, always run linter and tests, and fix any issues that arise.
Prefer using commands (`biome format`, `biome lint --fix`) over manual edits to fix formatting and lint issues.

Add new tests after implementing new features. In generally:
- Tests that don't require the terminal interpreting escape sequences should go under `tests/vitest`
- tests that require a full-fledged terminal environment should go under `tests/playwright`, which spins up a real xterm.js terminal to run tests
