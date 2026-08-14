"use client";

import { useEnsureSellersByArea } from "@/features/sellersByArea/hooks/useEnsureSellersByArea";
import { useAuthStore } from "@/stores/authStore";

/** Runs monthly sellers-by-area sync when the authenticated app shell loads. */
export default function SellersByAreaSync() {
  const authStatus = useAuthStore((state) => state.status);
  useEnsureSellersByArea(authStatus === "authenticated");
  return null;
}
