"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

/**
 * Only surface the current session in Account → Security.
 * Hides stale sessions (other IPs) and their Revoke buttons — Sign out on /app is enough.
 */
function useCurrentSessionOnly() {
  const { data, isPending, refetch, error } = authClient.useSession();
  const session = data?.session;

  return useMemo(
    () => ({
      data: session ? [session] : [],
      isPending,
      error,
      refetch,
    }),
    [session, isPending, error, refetch],
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/app"
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      localization={{
        SESSIONS: "This device",
        SESSIONS_DESCRIPTION:
          "Your current sign-in. Use Sign out on the home screen to end it — older devices are not listed here.",
      }}
      hooks={{
        useListSessions: useCurrentSessionOnly,
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
