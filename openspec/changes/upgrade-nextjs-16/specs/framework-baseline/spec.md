## ADDED Requirements

### Requirement: Supported, patched Next.js release
The application SHALL run on a Next.js release in Active LTS (16.x) at or above 16.3.3, with no `npm audit` findings of severity high or critical against the `next` package.

#### Scenario: Audit after upgrade
- **WHEN** `npm audit --omit=dev` is run after the upgrade
- **THEN** no high or critical advisories are reported for `next`, `postcss` (via next), or `sharp` (via next)

#### Scenario: Installed version check
- **WHEN** the installed `next` version is inspected
- **THEN** it is `16.3.8` (or a later 16.x patch)

### Requirement: Lint config matches the framework version
`eslint-config-next` SHALL be on the same minor version as `next`, and `npm run lint` SHALL complete without new errors introduced by the upgrade.

#### Scenario: Lint after upgrade
- **WHEN** `npm run lint` is run
- **THEN** it completes with no errors that weren't present before the upgrade

### Requirement: Production build succeeds with Turbopack
`npm run build` SHALL succeed using Next 16's default Turbopack builder, with no `webpack` configuration present that would fail or be silently ignored.

#### Scenario: Clean production build
- **WHEN** `npm run build` is run
- **THEN** it exits 0 without a "webpack configuration was found" error, and `npm run start` serves the app

### Requirement: Error monitoring keeps working
Sentry SHALL continue to capture server and client errors after the upgrade, with source maps uploaded during the production build when `SENTRY_AUTH_TOKEN` is set.

#### Scenario: Server error captured
- **WHEN** a server-side error is thrown in a dashboard route
- **THEN** it appears in the Sentry `barbs-bottles` project

#### Scenario: Client error captured through the tunnel
- **WHEN** a client-side error occurs in the browser
- **THEN** the event is sent through `/monitoring` and appears in Sentry

### Requirement: Application behavior is unchanged
All existing pages and server actions SHALL behave as they did before the upgrade.

#### Scenario: Core flows smoke test
- **WHEN** a logged-in user creates/edits a customer, edits a product design variant, uses the bulk design editor, creates/edits a multi-item order, uses global search, and opens a customer detail page map
- **THEN** each flow works exactly as on Next 15 (including stock decrement on orders)
