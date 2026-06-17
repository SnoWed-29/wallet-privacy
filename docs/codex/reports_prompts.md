Read and follow `AGENTS.md` before making changes.

Act as a senior full-stack Tauri engineer with experience in React, TypeScript, Rust, SQL, financial reporting, data visualization, accessibility, and local-first desktop applications.

## Task

Implement the first complete version of the app's **Reports, Charts, and Financial Statistics** feature.

Use the existing architecture, design system, financial models, money representation, date conventions, routing, Tauri commands, database layer, and testing conventions defined in the repository and `AGENTS.md`.

Do not use mock data in the final implementation.

## Before implementation

Inspect the relevant existing code, including:

* Transaction, account, category, budget, recurring-bill, and savings-goal models
* Existing Reports or Analytics page
* Existing dashboard statistics and charts
* Existing Tauri commands and frontend services
* Existing chart dependencies
* Money and currency handling
* Date filtering
* Existing tests

Reuse existing components and dependencies where practical.

## Reports page

Create or complete a dedicated Reports page with filters for:

* Month and year
* Custom date range
* Account
* Category
* Transaction type
* Currency when multiple currencies exist

Default to the current month.

All report sections must update from the active filters.

Include proper loading, error, and empty states.

## Summary statistics

Show:

* Total income
* Total expenses
* Net cash flow
* Savings rate
* Average daily spending
* Transaction count

Calculations:

`net cash flow = income - expenses`

`savings rate = net cash flow / income * 100`

Requirements:

* Exclude internal transfers
* Handle zero income safely
* Never display `NaN` or `Infinity`
* Use the existing money representation
* Format values using the correct currency
* Never combine different currencies without a real conversion system

## Income and expense trend

Add a responsive chart showing:

* Income
* Expenses
* Net cash flow when useful

Automatically group data:

* Up to 31 days: daily
* Medium ranges: weekly or monthly
* Long ranges: monthly

Use the existing chart library if suitable. Otherwise, add only one chart library, preferably `recharts`.

Create reusable chart wrappers and tooltips that match the existing design system.

## Category reports

Add separate reports for:

### Expenses by category

Show:

* Category
* Total spent
* Percentage of expenses
* Transaction count

Use:

* Donut chart for the top five or six categories
* Ranked list or horizontal bar chart for the full breakdown

Small categories may be grouped as `Other` in the donut only.

### Income by category

Show:

* Category
* Total income
* Percentage of income
* Transaction count

Do not mix income and expense categories into one chart.

Selecting a category should filter the report or open the Transactions page with the relevant filters.

## Period comparison

Compare the selected period with the immediately preceding equivalent period.

Show amount and percentage changes for:

* Income
* Expenses
* Net cash flow

Handle previous values of zero safely.

Use neutral wording and avoid judgmental messages.

## Budget performance

Show for each relevant budget:

* Name
* Category
* Limit
* Spent
* Remaining
* Percentage used
* Over-budget amount
* Status

Statuses:

* On track
* Approaching limit
* Over budget

Use existing business rules when available.

Only matching expense transactions from the correct category and period should count.

Do not count transfers, income, unrelated categories, or transactions outside the budget period.

## Account statistics

Show:

* Balance per account
* Account name
* Account type
* Currency
* Percentage of total when valid

Only use a distribution chart when all included accounts share a currency.

When currencies differ:

* Group by currency
* Do not create a combined total
* Do not invent exchange rates

## Recurring-bill statistics

Show:

* Expected bills
* Paid bills
* Unpaid bills
* Expected amount
* Paid amount
* Upcoming amount

Expected bills must remain separate from actual expenses until a real transaction exists.

## Savings-goal statistics

Show:

* Active goals
* Completed goals
* Total targets
* Recorded contributions
* Overall progress
* Contribution history for the selected period

Do not treat targets as actual balances.

Do not count a contribution twice when it is linked to a transaction.

## Yearly overview

When a complete year is selected, show 12 monthly periods with:

* Income
* Expenses
* Net cash flow

Also calculate:

* Annual income
* Annual expenses
* Annual net cash flow
* Average monthly income
* Average monthly expenses
* Highest-expense month
* Best net-cash-flow month

## Matching transactions

Add a compact table showing transactions matching the active report filters.

Include:

* Date
* Description
* Category
* Account
* Type
* Amount

Add a `View matching transactions` action that opens the Transactions page while preserving the filters.

Reuse existing table components where practical.

## Architecture

Do not calculate all report data directly inside React chart components.

Follow the repository architecture, preferably:

`Reports page -> report hooks/services -> Tauri commands -> Rust services/repositories -> database queries`

Backend/database responsibilities:

* Filtering
* Aggregation
* Grouping by date
* Category totals
* Account totals
* Period comparison
* Budget calculations
* Currency separation

Frontend responsibilities:

* Filter state
* Calling report commands
* Rendering cards and charts
* Loading, error, and empty states
* Drill-down navigation

Do not load the entire transaction history into React when database aggregation can be used.

Do not create database tables for derived reports.

A migration is allowed only for a clearly necessary index or performance improvement.

## Accuracy rules

The following are mandatory:

* Transfers do not count as income or expense
* Edited transactions update reports
* Deleted transactions disappear from reports
* Archived accounts and categories remain identifiable in historical data
* Expected bills are not actual expenses
* Savings targets are not balances
* Savings contributions are not counted twice
* Different currencies are not added together
* Local calendar dates are handled correctly
* Zero totals do not produce invalid percentages
* Reports never modify financial source data
* Financial data never leaves the device

## Edge cases

Handle:

* No transactions
* Only income
* Only expenses
* Only transfers
* One transaction
* Missing or archived categories
* Archived accounts
* Multiple currencies
* Previous period with no data
* Long account and category names
* Large transaction histories

Never display broken charts, empty legends, raw minor-unit values, `NaN`, or `Infinity`.

## Testing

Add backend tests for:

* Income and expense totals
* Net cash flow
* Savings rate
* Zero-income handling
* Transfer exclusion
* Date, account, category, and currency filters
* Daily, weekly, and monthly grouping
* Period comparisons
* Category aggregation
* Budget calculations
* Expected versus actual bill amounts
* Savings-contribution deduplication

Add frontend tests for:

* Filter behavior
* Resetting filters
* Loading, error, and empty states
* Summary rendering
* Chart data mapping
* Currency separation
* Drill-down navigation

Avoid tests that depend heavily on chart-library internals.

## Constraints

Do not:

* Change transaction semantics
* Change unrelated financial logic
* Add cloud services
* Add tracking
* Add AI advice or forecasting
* Add exchange-rate APIs
* Send financial data over the network
* Add production mock data
* Add multiple chart libraries
* Mix in a new design system
* Put all report logic in one large component
* Use floating-point values for stored money

## Implementation order

1. Inspect existing models and report-related code
2. Define report request and response types
3. Implement backend aggregation queries
4. Add Tauri report commands
5. Add frontend services or hooks
6. Build filters and summary cards
7. Build trend and category charts
8. Add period comparison
9. Add budget and account statistics
10. Add bill and savings-goal statistics
11. Add yearly overview
12. Add matching-transactions drill-down
13. Add edge states and tests
14. Run all available checks
15. Document the reporting architecture

Do not stop after adding only summary cards or one chart.

## Documentation

Create or update:

`docs/reports-and-analytics.md`

Document:

* Architecture
* Filters
* Calculation definitions
* Transfer handling
* Currency handling
* Date grouping
* Budget rules
* Recurring-bill handling
* Savings-goal handling
* Chart components
* Known limitations

## Acceptance criteria

The feature is complete when:

* Reports use real local data
* Filters affect every section
* Summary calculations are accurate
* Transfers are excluded
* Mixed currencies are handled honestly
* Trend and category charts work
* Period comparison works
* Budget performance works
* Account statistics work
* Expected bills remain separate from actual expenses
* Savings contributions are not duplicated
* Yearly overview shows 12 periods
* Matching transactions can be opened
* Empty, loading, and error states work
* Charts are responsive and match the existing design
* Everything works offline
* Existing features still work
* Relevant frontend and backend tests pass
* Production frontend and Tauri builds pass

## Final response

Report:

* Features implemented
* Architecture decisions
* Backend commands and queries added
* Frontend components added
* Files created and modified
* Dependencies added
* Tests and checks executed
* Failures or skipped checks
* Remaining limitations
* Manual testing required