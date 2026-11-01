import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Online checkout flow pages + shipping rates. Disabled (redirect to cart) unless
 * CHECKOUT_ENABLED=true — catalog-only launch orders via IG DM.
 */
const CHECKOUT_PAGES = new RegExp(
  `^/(${routing.locales.join("|")})/(checkout|order-success|order-status|line-callback|shipping)(/|$)`,
);

export default function middleware(req: NextRequest) {
  if (process.env.CHECKOUT_ENABLED !== "true") {
    const match = req.nextUrl.pathname.match(CHECKOUT_PAGES);
    if (match) {
      // 307 (temporary) — these pages come back once checkout is enabled
      return NextResponse.redirect(new URL(`/${match[1]}/cart`, req.url));
    }
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
