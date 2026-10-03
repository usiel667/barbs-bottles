## ADDED Requirements

### Requirement: Proxy is registered and runs on matched requests
The application SHALL register `proxy.ts` as the Next.js request proxy so that it executes on every request matching its `config.matcher`. A production build SHALL show the proxy as registered.

#### Scenario: Proxy appears in the production build
- **WHEN** `npm run build` completes
- **THEN** the build output and generated manifest list the proxy as active (not an empty middleware manifest)

#### Scenario: Proxy runs on a dashboard request
- **WHEN** any request is made to `/home`, `/customers`, `/products`, or `/orders` (or any sub-path)
- **THEN** the Kinde `withAuth` proxy handler executes before the page renders

### Requirement: Unauthenticated requests to protected paths are redirected
The proxy SHALL redirect any request without a valid Kinde session on a protected path to the Kinde login flow, and SHALL return the user to the originally requested page after login (`isReturnToCurrentPage: true`).

#### Scenario: Logged-out user opens a protected page
- **WHEN** a user with no session requests `/customers`
- **THEN** the response is a redirect into the login flow, and no customer data is rendered or sent

#### Scenario: Return to original page after login
- **WHEN** a logged-out user requests `/orders/form?id=5`, is redirected, and completes login
- **THEN** the user lands back on `/orders/form?id=5`

#### Scenario: Logged-in user passes through
- **WHEN** a user with a valid session requests `/products`
- **THEN** the proxy allows the request and the page renders normally

### Requirement: Public paths bypass the proxy
The proxy matcher SHALL exclude paths that must work without a session: the root `/`, `/login`, `/api/*` (including Kinde's `/api/auth/*` handlers), Next.js static and image assets (`/_next/static/*`, `/_next/image*`), `favicon.ico`, `robots.txt`, `/images/*`, and the Sentry tunnel route `/monitoring`.

#### Scenario: Login page is reachable while logged out
- **WHEN** a user with no session requests `/login`
- **THEN** the login page renders without a redirect loop

#### Scenario: Kinde callback is not intercepted
- **WHEN** Kinde redirects to `/api/auth/kinde_callback` after sign-in
- **THEN** the request reaches the `handleAuth` route handler without passing through the proxy

#### Scenario: Login page background image loads
- **WHEN** the logged-out login page requests `/images/bee_bottle.webp`
- **THEN** the image is served without a redirect

#### Scenario: Client errors reach Sentry while logged out
- **WHEN** the browser sends an error event to the Sentry tunnel route `/monitoring` from the login page
- **THEN** the request is not redirected to login and the event is forwarded to Sentry

### Requirement: Existing page and action auth checks remain
The proxy SHALL be an additional layer only. `app/(dashboard)/layout.tsx` SHALL keep its `getUser()` redirect, and every server action SHALL keep its `getUser()` / `Unauthorized` check.

#### Scenario: Server action called without a session
- **WHEN** a server action endpoint is invoked with no session
- **THEN** the action throws `Unauthorized` and performs no database write, independent of the proxy

### Requirement: Proxy produces no per-request debug logging
The proxy SHALL NOT write a log line for every request.

#### Scenario: Normal request in production
- **WHEN** a matched request is handled by the proxy
- **THEN** no `console.log` output is emitted by the proxy
