import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function proxy() {
    // withAuth handles the session check and login redirect.
  },
  {
    isReturnToCurrentPage: true,
  },
);

export const config = {
  matcher: [
    // Public: api (incl. Kinde /api/auth), static assets, images, login,
    // Sentry's /monitoring tunnel, and the root "/" (the `$` alternative).
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|images|login|monitoring|$).*)",
  ],
};
