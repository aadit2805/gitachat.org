import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect admin routes
  if (isAdminRoute(req)) {
    const { userId } = await auth();

    // Must be logged in
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Must be in admin list (if list is configured)
    if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

