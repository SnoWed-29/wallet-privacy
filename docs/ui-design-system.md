# Wallet UI Design System

Wallet uses a warm glass interface for a local-first desktop finance product.
Keep data workflows calm, readable, and usable without network access.

## Color Tokens

- Primary purple: `app-primary` / `#9C43A6` for primary actions, active navigation, and important analytics.
- Coral red: `app-coral` / `#DB515E` for expenses, destructive actions, and negative values.
- Warm peach: `app-peach` / `#FEA86A` for highlights, warm accents, and secondary chart data.
- Text: `app-text` / `#211B22`.
- Secondary text: `app-muted` / `#746B75`.
- Background: `app-background` / `#F8F2F3`.
- Semantic tokens: `app-success`, `app-warning`, `app-danger`, `app-info`, `app-income`, `app-expense`.

Do not hardcode brand hex values in components. Add or adjust tokens in
`src/styles/globals.css` and `tailwind.config.js`.

## Typography

Primary stack:

```text
Funnel Display, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Funnel Display is bundled locally in `src/assets/fonts/funnel-display/` with
its OFL license notice. Do not load fonts from Google Fonts or a CDN.

Scale:

- Hero: `text-hero`, 48px / 56px / 700.
- Page title: `text-page`, 32px / 40px / 700.
- Financial total: `text-total`, 28px / 36px / 700.
- Section title: `text-section`, 22px / 30px / 700.
- Card title: `text-card`, 18px / 26px / 600.
- Body: 16px / 24px.
- Compact/nav: 14px / 20px.
- Caption: `text-caption`, 12px / 16px.

## Spacing And Radius

Use Tailwind spacing based on 4px increments. Common spacing is `2`, `3`, `4`,
`5`, `6`, `8`, `10`, and `12`.

- Large containers: `rounded-app-lg` / 24px.
- Cards: `rounded-app` / 20px.
- Inputs and buttons: `rounded-app-sm` / 12px.
- Small icon containers: `rounded-app-xs` / 10px.
- Pills: `rounded-full`.

## Glass Surfaces

Use shared glass utilities:

- `glass-surface`: standard cards and shell pieces.
- `glass-surface-strong`: forms, tables, dialogs, and dense content.
- `glass-surface-light`: dashboard cards and lighter summary surfaces.

Glass rules:

- Prefer opacity between 48% and 86%.
- Use blur around 18px to 20px.
- Use subtle white borders and soft shadows.
- Do not put low-contrast text directly on very transparent surfaces.
- Do not use OS-level click-through transparency.

## Icons

Use `lucide-react` only. Standard stroke width is about 1.75px to 2px.

- Navigation icons: 18px to 20px.
- Action icons: 16px to 18px.
- Feature icons: 22px to 24px.
- Icon-only buttons must use `IconButton` with a descriptive `label`.
- Do not use emoji as interface icons.

## Shared Components

Primary shared components live in `src/components/ui/`:

- `AppButton`, `IconButton`
- `AppCard`, `GlassPanel`, `StatCard`
- `AppInput`, `AppSelect`, `AppTextarea`
- `FormField`, `FormSection`
- `AppTable`, `TableHeader`, `TableBody`, `TableCell`
- `AppBadge`, `FilterChip`, `ProgressBar`
- `AppModal`, `EmptyState`, `ToastProvider`

Use these before adding page-local Tailwind patterns.

## Responsive Breakpoints

The desktop shell uses a 240px sidebar, then collapses to an icon-only rail at
narrower desktop widths. At very small browser widths it stacks horizontally so
tests and previews remain usable.

Manual verification targets:

- 1280 x 720
- 1366 x 768
- 1440 x 900
- 1920 x 1080

Tables may scroll horizontally as a controlled fallback. Forms and dashboards
should reduce columns rather than shrinking text.

## Accessibility

- Keep visible focus states.
- Do not communicate financial status by color alone; use signs, labels, badges, or icons.
- Form fields need labels through `FormField` or native labels.
- Dialogs must trap focus and close on Escape.
- Respect reduced-motion preferences.
- Preserve stable route and workflow labels used by tests and assistive technology.
