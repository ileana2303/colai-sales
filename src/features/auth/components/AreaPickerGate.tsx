"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppLoader from "@/components/ui/AppLoader";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

const PICKER_PATH = "/select-seller";

export default function AreaPickerGate() {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);
  const userInfos = useAuthStore((state) => state.userInfos);
  const hydrated = useSelectedSellerStore((state) => state.hydrated);
  const selectedSeller = useSelectedSellerStore((state) => state.selectedSeller);
  const hydrateFromSession = useSelectedSellerStore(
    (state) => state.hydrateFromSession,
  );
  const pickerUser = isAreaPickerUser(userInfos);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    void hydrateFromSession();
  }, [authStatus, hydrateFromSession]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !hydrated) return;
    if (!pickerUser) return;
    if (pathname === PICKER_PATH) return;
    if (!selectedSeller) {
      router.replace(PICKER_PATH);
    }
  }, [
    authStatus,
    hydrated,
    pathname,
    pickerUser,
    router,
    selectedSeller,
  ]);

  if (authStatus === "authenticated" && pickerUser && !hydrated) {
    return (
      <AppLoader overlay label="Φόρτωση επιλογής περιοχής…" card={false} />
    );
  }

  return null;
}
