import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.appRole !== "admin") {
    redirect("/pools");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminNav />
      {children}
    </div>
  );
}
