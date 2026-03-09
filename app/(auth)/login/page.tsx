import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginButtons } from "./login-buttons";
import { SiteFooter } from "@/components/site-footer";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { callbackUrl } = await searchParams;

  if (session) {
    redirect(callbackUrl ?? "/pools");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link
            href="/"
            className="font-heading text-lg font-bold uppercase tracking-wide"
          >
            Bracketsball
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 px-4">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Sign in to start competing
            </p>
          </div>
          <LoginButtons callbackUrl={callbackUrl} />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
