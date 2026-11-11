# Verified test results

## Summary

The dedicated test suite passed **113 of 113 automated tests across four files**, with no failed or skipped cases. This preserves the previous 72 cases and adds 41 boundary/UI regression cases. Both targeted test commands and the production build also succeeded.

Verification environment: Node.js 24.21.0, Vitest 5.1.0, jsdom 26, and Vite 6.4.6 in the local WSL environment. Tests use a fixed clock of `2026-11-11T03:00:00.000Z`; that is fixture time, not a measured execution timestamp.

This is a snapshot of the test-organization work. Rerun the commands after later changes; this Markdown file is not automatically regenerated.

## Executed commands

All commands ran from the project root against the new `tests/` directory after removing the obsolete `src/test/` files.

| Command                    | Observed result                                                      | Reported duration |
| -------------------------- | -------------------------------------------------------------------- | ----------------- |
| `npm run test:report`      | 4 files passed; 113 tests passed; JSON report written.               | 25.18 s           |
| `npm test`                 | 4 files passed; 113 tests passed on a second full run.               | 20.02 s           |
| `npm run test:unit`        | 2 files passed; 79 tests passed.                                     | 9.37 s            |
| `npm run test:integration` | 2 files passed; 34 tests passed.                                     | 19.29 s           |
| `npm run build`            | Production bundle generated successfully; 1,619 modules transformed. | 41.21 s           |

Durations are local observations, not performance acceptance thresholds. Test startup and WSL filesystem overhead are included in Vitest's suite duration. Repeated command runs exercise the same tests; their counts must not be added together as distinct cases.

## File-level results

| File                                    | Category                                                 |  Passed | Failed | Skipped |
| --------------------------------------- | -------------------------------------------------------- | ------: | -----: | ------: |
| `tests/unit/business.test.js`           | Calendar, finances, lifecycle, sales, roles, persistence |      51 |      0 |       0 |
| `tests/unit/boundaries.test.js`         | Input boundaries and state-integrity regressions         |      28 |      0 |       0 |
| `tests/integration/app.test.jsx`        | Authentication, daily logs, owner workflows              |      21 |      0 |       0 |
| `tests/integration/regression.test.jsx` | UI persistence, recovery, confirmations                  |      13 |      0 |       0 |
| **Total**                               |                                                          | **113** |  **0** |   **0** |

Parameterized scenarios count as separate executions. For example, AUTH-04 expands into six guarded routes, BND-04 into six invalid action payloads, and UI-05 into four completed-batch tabs. See [the case catalog](TEST_CASES.md) for their exact inputs and assertions.

## Evidence and reporting

The full report run produced:

```text
Test Files  4 passed (4)
     Tests  113 passed (113)
JSON report written to tests/reports/latest.json
```

The generated [JSON report](../reports/latest.json) contains per-test names, results, timing, and failure details when applicable. It is ignored by Git, so it may not exist in a fresh checkout. Generate or refresh it with:

```bash
npm run test:report
```

The report reflects the reporting run, not later commands that do not use the JSON reporter. The separate plain full-suite run confirmed the same 113-case result. `git check-ignore tests/reports/latest.json` also confirmed that generated reports are excluded from version control.

## Test harness checks

- Confirmed that jsdom's dialog prototype lacks `showModal` and `close`; setup supplies reversible stubs instead of spying on absent methods.
- The stubs toggle `open` so confirmation logic can be tested, then restore the original descriptors after each test.
- Date-only fake timers were exercised successfully by all 34 integration cases while interaction timers remained real.
- Storage failure tests passed with injected throwing storage and a quota-exception spy; normal recording remained available in memory.
- Only test infrastructure, test files, and documentation changed for this request. No application behavior was changed to force the new cases to pass.

## Not executed or not established

| Check                                   | Status              | Suggested verification                                                                                                                                      |
| --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-browser showcase flow              | Not run             | In a fresh demo session, log in as Owner, create a batch, switch to Worker for daily records, then harvest, sell to two clients, and close as Owner.        |
| Actual refresh / hash deep links        | Not run             | Save a record, refresh the same tab, and open a protected hash route. Check persistence and the role guard. UI-02 only unmounts/remounts React.             |
| Mobile layout and touch targets         | Not run             | At approximately 375 px and desktop widths, check overflow, table scrolling, navigation, input usability, and touch-target sizes.                           |
| Native dialog keyboard behavior         | Not run             | Check Tab/Shift+Tab focus containment, Escape dismissal, visible focus, and focus return after cancel/confirm.                                              |
| Chrome/Safari and physical devices      | Not run             | Repeat core forms and date inputs on supported desktop browsers and Android/iOS devices.                                                                    |
| Full accessibility audit                | Not run             | Check contrast, keyboard-only navigation, screen-reader announcements, heading order, and zoom. Label-based test queries alone are not compliance evidence. |
| Dashboard presentation                  | Partially asserted  | Check every pond card, age/countdown display, near-harvest warning, and the visible demo label.                                                             |
| History date filter                     | Not directly tested | Combine a date filter with batch/type filters and verify the matching entries and empty state.                                                              |
| Code coverage percentages               | Not measured        | Add compatible coverage tooling and collect line/branch/function metrics before reporting percentages.                                                      |
| Load/performance or production security | Not tested          | Define separate requirements first. Mock auth and browser storage are demo-only and cannot establish server-side protection.                                |

The build check confirms bundling, not real-browser rendering. No screenshot or browser-compatibility result is implied by these passing tests.
