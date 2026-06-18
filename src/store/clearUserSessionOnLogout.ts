import { clearUserSessionLocalStorage } from "@/lib/clearUserSession";
import { resetWcDiadikasiaUserSession } from "@/store/wcDiadikasia/wcDiadikasiaSlice";
import type { AppDispatch } from "@/store/store";

export function clearUserSessionOnLogout(dispatch: AppDispatch): void {
  clearUserSessionLocalStorage();
  dispatch(resetWcDiadikasiaUserSession());
}
