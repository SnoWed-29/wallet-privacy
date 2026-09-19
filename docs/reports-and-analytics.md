# Reports and Analytics

Wallet reports are derived from local SQLite data and never modify financial
source records.

## Architecture

The reporting flow follows the app architecture:

```text
Reports page -> useReports hook -> get_reports_summary command
-> ReportService -> ReportRepository -> SQLite
```

Backend responsibilities:

- Validate report filters.
- Load filtered transaction rows with account, category, and currency context.
- Aggregate summaries, trends, category totals, comparisons, budgets, accounts,
  recurring bills, savings goals, yearly overview, and matching transactions.
- Keep currencies separated.

Frontend responsibilities:

- Own filter form state.
- Call `get_reports_summary`.
- Render report sections, charts, loading/error/empty states, and drill-downs.
- Preserve matching filters when opening the Transactions page.

Reports do not create database tables. Report values are derived from existing
accounts, categories, transactions, budgets, recurring bills, and savings goals.

## Filters

Reports support:

- Start date and end date
- Account
- Category
- Transaction type
- Currency

The default frontend filter is the current calendar month. Dates use
`YYYY-MM-DD`, matching the rest of the app.

## Calculations

For each currency:

- Total income: sum of matching income transactions.
- Total expenses: sum of matching expense transactions.
- Net cash flow: income minus expenses.
- Savings rate: net cash flow divided by income, multiplied by 100.
- Average daily spending: expenses divided by inclusive day count.
- Transaction count: matching income and expense transactions.

Zero income returns a savings rate of `0`, never `NaN` or `Infinity`.

## Currency Handling

Transaction currency comes from the transaction account. Wallet does not convert
currencies and does not use exchange rates.

When multiple currencies match the filters:

- Totals are shown separately by currency.
- Account balances are grouped by currency.
- Distribution percentages are calculated only inside a currency group.
- No combined multi-currency total is displayed.

## Date Grouping

Trend grouping is selected from the inclusive date range:

- Up to 31 days: daily
- 32 to 180 days: weekly
- Longer ranges: monthly

When the selected range is a complete calendar year, Wallet also returns a
12-month yearly overview.

## Category Reports

Income and expense categories are reported separately.

Each category row includes:

- Category
- Currency
- Total amount
- Percentage of the matching income or expense total for that currency
- Transaction count

The donut chart groups small categories into `Other` only in the visual chart.
The ranked list keeps the full category breakdown.

## Period Comparison

Reports compare the selected period with the immediately preceding period of the
same length.

Each currency includes income, expenses, and net cash flow changes. Percentage
change is omitted when the previous value is zero.

## Budget Rules

Budget performance uses existing monthly budget rules:

- Only expense transactions count.
- Transactions must match the budget category.
- Transactions must fall inside the budget month.
- Income, unrelated categories, and transactions outside the budget month do
  not count.

Current limitation: budgets do not store currency. The report presents budget
limits in the selected or detected transaction currency context. A future budget
currency field would make this more explicit.

## Account Statistics

Account balances are derived from initial balance plus income minus expenses.

Reports include archived accounts so historical report data remains
identifiable. Account distribution percentages are calculated only when a
currency group has a positive total.

## Recurring Bills

Recurring-bill statistics keep expected bills separate from actual expenses.

The report shows:

- Expected bills and amount from due dates in the period
- Paid bills and amount from recorded `last_paid_date`
- Unpaid/upcoming amount from due bills without a matching paid date in the
  selected period

Current limitation: recurring bills do not store a full schedule history, so
older expected occurrences cannot be reconstructed after the bill advances.

## Savings Goals

Savings targets are not treated as balances.

Reports show active goals, completed goals, total active targets, overall
progress, and contribution transactions in the selected period.

Recorded contributions come from expense transactions in the reserved
`Saving Contribution` category. This avoids counting a savings goal target and a
contribution transaction as the same money twice.

## Charts

The frontend uses local SVG chart components:

- Trend line chart
- Category donut chart
- Category horizontal bars
- Yearly income/expense bars

No chart library is currently required. Charts use existing design tokens and
render empty states when there is no data.

## Known Limitations

- There is no transfer transaction type yet, so report logic defensively ignores
  unknown transaction types but cannot report transfers until the model exists.
- Budgets do not store currency.
- Recurring bills do not store generated schedule history.
- Reports are analytic views only; report export is not implemented.
- No exchange-rate conversion is performed.
