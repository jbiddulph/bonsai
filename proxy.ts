import { auth } from "@/lib/auth/server";
import type { NextRequest } from "next/server";

const authMiddleware = auth.middleware({
  loginUrl: "/auth/sign-in",
});

export function proxy(request: NextRequest) {
  // Server Actions authenticate inside the action itself.
  if (request.headers.has("Next-Action")) {
    return;
  }

  return authMiddleware(request);
}

export const config = {
  matcher: ["/", "/account/:path*"],
};
