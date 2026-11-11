# Test-case catalog

This catalog explains the executable tests in `tests/unit/` and `tests/integration/`. Run commands and shared setup are described in [the test guide](../README.md); actual execution outcomes are recorded in [the results](TEST_RESULTS.md).

## Scope and reading conventions

- Unit tests execute actual business functions; integration tests execute the React application in jsdom.
- Each row identifies the inputs/actions and the assertions made. A passing case means those assertions passed, not that every possible variation was tested.
- `Cases` counts parameterized executions. A row with multiple assertions can still be one case.
- Unless stated otherwise, tests use a fresh demo seed, the Owner role, and the frozen Jakarta date of November 11, 2026.
- Batch A contains 5,000 initial fish, 45 deaths, Rp 3,370,000 total cost, and no initial harvest. Batch B is completed; Kolam C is empty.
- Monetary values in the tables are IDR; weight is kilograms; fish counts are whole fish.

## Calendar and display — `unit/business.test.js`

| ID     | Cases | Input / action                                                             | Expected result                                                                                                           |
| ------ | ----: | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| CAL-01 |     1 | Convert `2026-11-10T18:00:00Z` to a Jakarta calendar date.                 | `2026-11-11`, despite the previous UTC date.                                                                              |
| CAL-02 |     4 | Add 90 days to `2026-01-01`, `2024-01-01`, `2026-11-11`, and `2024-02-29`. | Respectively `2026-04-01`, `2024-03-31`, `2027-02-09`, and `2024-05-29`. Includes leap-year and year-rollover boundaries. |
| CAL-03 |     1 | Calculate age from September 12 to November 11, 2026.                      | Exactly 60 calendar days.                                                                                                 |
| CAL-04 |     1 | Format 1,250,000.4 Rupiah and `2026-11-11`.                                | `Rp 1.250.000` and `11/11/2026`.                                                                                          |

## Seed and finances — `unit/business.test.js`

| ID     | Cases | Input / action                                                          | Expected result                                                                                                                                                             |
| ------ | ----: | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIN-01 |     1 | Generate the demo seed and inspect pond occupancy and active-batch age. | Structurally valid state, three ponds, active 60-day batch in A, no active batch in B or C.                                                                                 |
| FIN-02 |     1 | Calculate the completed batch B summary.                                | Cost 7,100,000; feed cost 5,400,000; revenue 13,387,500; profit 6,287,500; harvested and sold 547.5; outstanding and unsold zero. Mortality and margin match manual ratios. |
| FIN-03 |     1 | Calculate finances for unsold active batch A.                           | Margin is `null`; profit is -3,370,000.                                                                                                                                     |
| FIN-04 |     1 | Subtract sales of 0.1 and 0.2 from a harvest of 0.3.                    | Unsold weight is exactly positive zero, without a floating-point residue or negative zero.                                                                                  |

### Independent financial calculation used by FIN-02

```text
Seedling cost      = 1,350,000
Feed cost          = 5,400,000
Other cost         =   350,000
Total cost         = 7,100,000
Revenue            = 13,387,500
Gross profit       = 13,387,500 - 7,100,000 = 6,287,500
Margin             = (6,287,500 / 13,387,500) * 100
Mortality rate     = (120 / 4,500) * 100
Unsold harvest     = 547.5 - 547.5 = 0 kg
Outstanding        = 0, because both seeded sales are paid
```

The test compares financial totals with explicit constants rather than another call to the same calculation function. Percentage comparisons use numerical tolerance.

## Batch lifecycle — `unit/business.test.js`

| ID     | Cases | Input / action                                                                                    | Expected result                                                                                               |
| ------ | ----: | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| BAT-01 |     1 | Start another batch in occupied Kolam A.                                                          | Rejected with an occupancy message; original batch count remains two.                                         |
| BAT-02 |     1 | Harvest batch A, then start another batch in its pond.                                            | A pond occupied by a `panen` batch is also rejected.                                                          |
| BAT-03 |     1 | Create a valid batch in Kolam C.                                                                  | Returned ID matches the batch; code `LL-003`, status `aktif`, farm `farm-demo`.                               |
| BAT-04 |     1 | Start a new batch in Kolam B, whose prior batch is completed.                                     | Accepted; three batches including history.                                                                    |
| BAT-05 |     1 | Record partial harvests of 30 and 70.                                                             | Status becomes `panen`; total harvest is 100.                                                                 |
| BAT-06 |     1 | Harvest 100, sell 20 unpaid, request closure without confirmation, then confirm and reuse pond A. | Two warnings; unconfirmed closure rejected; confirmed status `selesai`; pond released and new batch accepted. |
| BAT-07 |     5 | Attempt FEED, MORTALITY, HARVEST, SALE, and SET_COST on completed batch B.                        | Every operational mutation is rejected as completed.                                                          |
| BAT-08 |     1 | Replace batch A's other-cost field with 100,000.                                                  | Stored total is exactly 100,000, not an accumulated charge.                                                   |

## Sales and payments — `unit/business.test.js`

| ID     | Cases | Input / action                                                                                                  | Expected result                                                                                                                |
| ------ | ----: | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SAL-01 |     1 | Sell 100.01 after harvesting 100.                                                                               | Rejected for exceeding available harvest.                                                                                      |
| SAL-02 |     1 | Sell before any harvest.                                                                                        | Rejected; no harvested inventory is available.                                                                                 |
| SAL-03 |     1 | Harvest 100; sell 40 at 24,000 paid to client 1 and 60 at 25,000 unpaid to client 2; attempt another 0.01 sale. | Revenue 2,460,000, receivables 1,500,000, unsold zero; extra sale rejected.                                                    |
| SAL-04 |     1 | Sell 100 unpaid at 25,000, close the batch, then mark the sale paid.                                            | Settlement remains allowed after closure; receivables zero and revenue unchanged at 2,500,000.                                 |
| SAL-05 |     1 | Sell with a date one day earlier than its only harvest.                                                         | Rejected by chronological inventory validation.                                                                                |
| SAL-06 |     1 | Harvest 100 on day -10, sell it on day -8, harvest another 100 today, then insert a sale of 100 on day -9.      | Rejected: the inserted sale would make the existing day -8 balance negative, even though today's total stock seems sufficient. |

## Validation and permissions — `unit/business.test.js`

| ID     | Cases | Input / action                                                                                        | Expected result                                                                         |
| ------ | ----: | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| VAL-01 |     6 | Validate -1, NaN, Infinity, an empty string, null, and nonnumeric text.                               | Each invalid numeric input throws.                                                      |
| VAL-02 |     1 | Supply 1.5 fish and a 0.5 Rupiah seedling cost.                                                       | Whole-number validation rejects both.                                                   |
| VAL-03 |     1 | Record feed before stocking or tomorrow; create a batch dated February 30, 2025.                      | Each invalid date is rejected with the appropriate date message.                        |
| VAL-04 |     1 | Record 5,000 deaths after 45 already recorded from 5,000 seedlings.                                   | Rejected because cumulative losses exceed remaining fish.                               |
| VAL-05 |     7 | As Worker, call NEW_BATCH, HARVEST, SALE, CLOSE_BATCH, SET_COST, MARK_PAID, and RESET.                | Each action rejects non-Owner access, independent of UI hiding.                         |
| VAL-06 |     1 | Worker records 7.5 feed with no cost and zero deaths with a note, then attempts feed with cost 5,000. | Operational records accepted, default feed cost zero; nonzero financial input rejected. |
| VAL-07 |     1 | Attempt a mutation without a role/session.                                                            | Rejected with a login-required message.                                                 |

## Persistence and recovery — `unit/business.test.js`

| ID     | Cases | Input / action                                                              | Expected result                                                      |
| ------ | ----: | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| STO-01 |     1 | Create a new batch, save state, then load state.                            | Save succeeds and the restored state equals the changed state.       |
| STO-02 |     1 | Load malformed JSON, incomplete data, and an unsupported version envelope.  | Each falls back to a three-pond seed and returns a warning.          |
| STO-03 |     1 | Inject a storage object whose read and write methods throw.                 | Load returns a usable seed; save returns false rather than throwing. |
| STO-04 |     1 | Create a batch, reset the data, save, and inspect an unrelated storage key. | Seed batch count restored to two; unrelated key preserved.           |

## Boundary regressions — `unit/boundaries.test.js`

| ID     | Cases | Input / action                                                                                                                    | Expected result                                                                                |
| ------ | ----: | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| BND-01 |     5 | Supply whitespace, true, false, an object, and undefined to numeric validation.                                                   | All rejected as missing/invalid numeric inputs, rather than silently coercing to numbers.      |
| BND-02 |     1 | Validate `1.25`, `1.001`, positive-only zero, and `1e12 + 1`.                                                                     | Two decimals accepted; excess precision, nonpositive weight, and excessive magnitude rejected. |
| BND-03 |     3 | Create a batch with zero seedlings, a nonexistent supplier, or a nonexistent pond.                                                | Appropriate positive-value or reference validation rejects each.                               |
| BND-04 |     6 | Set feed quantity, feed cost, death count, harvest weight, sale price, or other cost to -1.                                       | Rejected; the original state equals its pre-action deep clone in every case.                   |
| BND-05 |     1 | Record feed with a whitespace-only type.                                                                                          | Rejected as a missing feed type.                                                               |
| BND-06 |     1 | Record a harvest without a fish count.                                                                                            | Count stored as `null`; resulting state remains valid.                                         |
| BND-07 |     1 | After 45 deaths, harvest 4,900 fish; attempt another 56, then another 55.                                                         | 56 rejected; exactly 55 accepted; total harvested weight becomes 110.                          |
| BND-08 |     1 | Harvest all 4,955 remaining counted fish, then record one additional death.                                                       | Rejected because harvested fish are excluded from the available count.                         |
| BND-09 |     1 | Harvest 0.3 and sell 0.1 plus 0.2 at 25,000/kg.                                                                                   | Both accepted; exact zero stock and revenue 7,500.                                             |
| BND-10 |     2 | Sell to an unknown client or use string `"true"` as payment status.                                                               | Missing client and non-boolean payment status rejected.                                        |
| BND-11 |     1 | Mark the same sale paid twice.                                                                                                    | Second result equals the first; unrelated sales unchanged; revenue stays 1,250,000.            |
| BND-12 |     4 | Corrupt seed data with duplicate log IDs, a missing client reference, two active batches in one pond, or a harvest after closure. | State validator returns false for each corruption.                                             |
| BND-13 |     1 | Owner saves feed without a cost.                                                                                                  | Default cost zero; one new log; original input state unchanged.                                |

## Authentication and routes — `integration/app.test.jsx`

| ID      | Cases | Interaction                                                                                                    | Expected result                                                       |
| ------- | ----: | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| AUTH-01 |     1 | Click the Owner demo login button.                                                                             | Owner dashboard heading and revenue label appear.                     |
| AUTH-02 |     1 | Click the Worker demo login button.                                                                            | Worker home appears without money or financial labels.                |
| AUTH-03 |     1 | Submit an invalid Owner password, then the valid demo password.                                                | Error first; financial dashboard after valid login.                   |
| AUTH-04 |     6 | As Worker, open dashboard, batch list, new batch, completed batch details, sales, and owner batch-feed routes. | Every route redirects to worker home without financial text.          |
| AUTH-05 |     4 | Render `/worker`, `/feed`, `/mortality`, and `/history` as Worker.                                             | No Rupiah amounts or specified financial labels in the rendered body. |
| AUTH-06 |     1 | Open a protected sales deep link without a session.                                                            | Redirected to login.                                                  |
| AUTH-07 |     1 | Log out from the owner dashboard.                                                                              | Login appears and the session key is removed.                         |

## Recording and showcase workflows — `integration/app.test.jsx`

| ID      | Cases | Interaction                                                                                                                          | Expected result                                                                                                                                                 |
| ------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DAY-01  |     1 | Worker saves 12.5 kg of feed.                                                                                                        | No cost field; success toast, persisted log with cost zero, and visible history.                                                                                |
| DAY-02  |     1 | Worker records three deaths and a note.                                                                                              | Count and note persisted; note appears in history.                                                                                                              |
| DAY-03  |     1 | Filter worker history to batch A and mortality.                                                                                      | Exactly three seeded mortality entries; no feed entries.                                                                                                        |
| FLOW-01 |     1 | Try starting 1,000 seedlings at cost 300,000 in A, then select C.                                                                    | A produces an occupancy error; 90-day estimate displayed; C creates `LL-003` and persists `pond-c`.                                                             |
| FLOW-02 |     1 | Harvest 100; attempt sale of 101; sell 40 unpaid at 25,000 and 50 paid at 24,000 to different clients; open summary and close batch. | Oversale rejected; two valid sales saved; revenue 2,200,000 shown; warnings for 10 unsold kg and unpaid sale; confirmed closure saved and close button removed. |
| FLOW-03 |     1 | Open reset dialog, cancel, reopen, then confirm.                                                                                     | Cancel dismisses dialog; confirmation displays success and two seeded batches. Changed-state reset is independently covered by STO-04.                          |

## UI regressions — `integration/regression.test.jsx`

| ID    | Cases | Interaction                                                                                      | Expected result                                                                                                                    |
| ----- | ----: | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| UI-01 |     1 | Owner saves 10 kg feed costing 120,000.                                                          | Weight and cost persisted; calculated batch total becomes 3,490,000.                                                               |
| UI-02 |     1 | Worker saves a feed record, unmounts, then mounts the app on history without reinjecting a role. | Saved record visible; Worker session restored; no Rupiah amounts rendered. This simulates app restart, not a real browser refresh. |
| UI-03 |     1 | Open a nonexistent batch.                                                                        | Not-found heading and link back to `/batches`.                                                                                     |
| UI-04 |     1 | Close the only active batch and open Worker feed input.                                          | No-active-batch empty state; save button absent.                                                                                   |
| UI-05 |     4 | Open completed batch feed, mortality, harvest, and sale tabs.                                    | Read-only notice; recording and closure buttons absent.                                                                            |
| UI-06 |     1 | On a closed batch with one unpaid sale, cancel settlement, then confirm it.                      | Cancel leaves it unpaid; confirmation marks paid, removes settlement button, clears receivables, and preserves revenue 1,250,000.  |
| UI-07 |     1 | Change other costs to 100,000 through batch summary.                                             | Updated field persisted; total cost 3,220,000 displayed.                                                                           |
| UI-08 |     1 | Make storage writes throw a quota exception, then record Worker feed.                            | Storage warning shown; in-memory save and history still work; warning advises against reloading.                                   |
| UI-09 |     1 | Request closure of an unharvested batch, then cancel.                                            | No-harvest warning shown; batch remains active; dialog closes.                                                                     |
| UI-10 |     1 | Enter a password and toggle visibility twice.                                                    | Input type switches password → text → password; entered value retained when revealed.                                              |

## Requirement traceability

Sources: [BRD](../../docs/BRD_Ternak_Lele_Management_System.md), [PRD](../../docs/PRD_Ternak_Lele_Management_System.md), and [TRD](../../docs/TRD_Ternak_Lele_Management_System.md).

These are coverage references, not a claim that every detail of each requirement has been exhaustively verified. Additional validation rules such as chronological stock and decimal precision are implementation regressions.

| PRD requirement                           | Related BRD / TRD          | Automated evidence and boundaries                                                                                                                   |
| ----------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 Credentials                          | BRD §5; TRD §7             | AUTH-03 checks invalid/valid Owner credentials; UI-10 checks visibility. Credential-form login for Worker is not separately exercised.              |
| F-02 Demo login                           | BRD §5; TRD §7             | AUTH-01, AUTH-02.                                                                                                                                   |
| F-03 Role access                          | BR-9; TRD §7               | AUTH-04–07, VAL-05–07, DAY-01, UI-02. Covers UI and client actions, not server security.                                                            |
| F-04 Dashboard                            | BRD §3; TRD §9–10          | FIN-01 and CAL-03 cover seed occupancy/age; AUTH-01 verifies dashboard presence. Countdown and all dashboard card values are not directly asserted. |
| F-05 New batch                            | BR-1; TRD §4–5             | BAT-03–04, FLOW-01, BND-03, VAL-02–03.                                                                                                              |
| F-06 90-day estimate                      | BR-3; TRD §5–6             | CAL-01–03, FLOW-01.                                                                                                                                 |
| F-07 Pond occupancy                       | BR-2; TRD §5               | BAT-01–02, BAT-06, FLOW-01, BND-12.                                                                                                                 |
| F-08 Feed                                 | BR-5; TRD §4–5             | DAY-01, UI-01, VAL-03/06, BND-04/05/13.                                                                                                             |
| F-09 Mortality                            | BR-5; TRD §4–6             | DAY-02–03, VAL-04/06, BND-04/08, FIN-02.                                                                                                            |
| F-10 Harvest                              | BR-4; TRD §4–5             | BAT-05, FLOW-02, BND-04/06/07.                                                                                                                      |
| F-11 Sales/payment                        | BR-7; TRD §4–6             | SAL-03–04, FLOW-02, BND-10–11, UI-06.                                                                                                               |
| F-12 Sale limit                           | BR-6; TRD §5               | SAL-01–03/05/06, FIN-04, BND-09, FLOW-02.                                                                                                           |
| F-13 Financial summary                    | BR-7/8/10; TRD §6          | FIN-02–04, CAL-04, SAL-03–04, FLOW-02, UI-07.                                                                                                       |
| F-14 Batch closure                        | BR-4; TRD §5               | BAT-06–07, FLOW-02, UI-04/05/06/09.                                                                                                                 |
| F-15 Demo reset                           | BRD §9; TRD §10            | STO-04, FLOW-03, VAL-05.                                                                                                                            |
| F-16 Other costs                          | BR-8; TRD §6               | BAT-08, BND-04, UI-07.                                                                                                                              |
| Persistence/recovery                      | BRD §9; TRD §2/10/11       | STO-01–04, BND-12, UI-02/08. jsdom storage and remount simulation, not real-device storage testing.                                                 |
| Locale/timezone                           | BR-10; PRD §10; TRD §9     | CAL-01–04 and financial text assertions in FLOW-02/UI-07.                                                                                           |
| Worker history                            | PRD §4/6; TRD §9           | DAY-02–03 and UI-02. Date filtering is not separately exercised.                                                                                    |
| Responsive/browser/accessibility behavior | BRD §7; PRD §10; TRD §9/11 | Not established by jsdom; see remaining manual checks in the results document.                                                                      |

## Remaining scope

There are no browser screenshot, mobile layout, performance benchmark, network-isolation, full accessibility, or cross-browser tests in this suite. Actual browser reloads, native dialog keyboard behavior, dashboard countdown presentation, date-only history filtering, and visible demo labeling should receive additional targeted checks. Mock authentication and client-only persistence are intentional demo constraints, not production security controls.
