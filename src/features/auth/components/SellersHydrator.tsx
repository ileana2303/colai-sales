"use client";

import { useEffect } from "react";

import { fetchPowerBiSellers } from "@/lib/api/powerbi";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";
import { useSellersStore } from "@/stores/sellersStore";

export default function SellersHydrator() {
  const authStatus = useAuthStore((state) => state.status);
  const selectedSellerCode = useSelectedSellerStore(
    (state) => state.selectedSeller?.sellerCode,
  );
  const setLoading = useSellersStore((state) => state.setLoading);
  const setSellers = useSellersStore((state) => state.setSellers);
  const setError = useSellersStore((state) => state.setError);
  const reset = useSellersStore((state) => state.reset);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      reset();
      return;
    }

    let cancelled = false;
    setLoading();

    void fetchPowerBiSellers()
      .then((data) => {
        if (cancelled) return;

        if (data.ok) {
          setSellers(data.records, data.matched);
          return;
        }

        setError();
      })
      .catch(() => {
        if (!cancelled) {
          setError();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, reset, selectedSellerCode, setError, setLoading, setSellers]);

  return null;
}
