import AppShell from "@/components/shell/AppShell";
import AreaPickerGate from "@/features/auth/components/AreaPickerGate";
import AuthHydrator from "@/features/auth/components/AuthHydrator";
import SellersHydrator from "@/features/auth/components/SellersHydrator";

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
      <AreaPickerGate />
      <SellersHydrator />
      {children}
    </AppShell>
  );
}
