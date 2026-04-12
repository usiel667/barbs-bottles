import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest } from "next/server";

export default withAuth(
  async function proxy(request: NextRequest) {
    //additional prox logic if needed
    console.log("Proxy running for:", request.nextUrl.pathname);

  },
  {
    isReturnToCurrentPage: true,
  },
);

export const config = {
  matcher: [

    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|images|login|$).*)",

  ],
};
