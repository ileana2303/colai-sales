"use client";

import { usePathname, useRouter } from "next/navigation";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { isAreaPickerUser } from "@/lib/managerPickerAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

const HIDDEN_PATHS = new Set(["/select-seller"]);

export function SelectedSellerBar() {
  const pathname = usePathname();
  const router = useRouter();
  const userInfos = useAuthStore((state) => state.userInfos);
  const hydrated = useSelectedSellerStore((state) => state.hydrated);
  const selectedSeller = useSelectedSellerStore((state) => state.selectedSeller);

  if (
    !isAreaPickerUser(userInfos) ||
    !hydrated ||
    !selectedSeller ||
    HIDDEN_PATHS.has(pathname)
  ) {
    return null;
  }

  return (
    <section
      className="selected-seller-nav"
      aria-label="Επιλεγμένος πωλητής για προβολή αναφορών"
    >
      <div className="selected-seller-nav__icon" aria-hidden>
        <AppIcon name="bi-people" size={18} />
      </div>

      <div className="selected-seller-nav__content">
        <div className="selected-seller-nav__label">Προβολή αναφορών για</div>
        <div className="selected-seller-nav__details">
          <span className="selected-seller-nav__name">
            {selectedSeller.salesPerson}
          </span>
          <span className="selected-seller-nav__meta">
            {selectedSeller.area} · {selectedSeller.team} · Κωδ.{" "}
            {selectedSeller.sellerCode}
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="selected-seller-nav__action font-semibold shadow-sm"
        onClick={() => router.push("/select-seller")}
      >
        <AppIcon name="bi-arrow-repeat" size={15} />
        <span className="selected-seller-nav__action-label">Αλλαγή πωλητή</span>
      </Button>
    </section>
  );
}
