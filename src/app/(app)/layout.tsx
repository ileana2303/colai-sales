import AppShell from "@/components/shell/AppShell";
import AuthHydrator from "@/features/auth/components/AuthHydrator";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) redirect("/login");

  return (
    <AppShell>
      <AuthHydrator />
      {children}
    </AppShell>
  );
}
