import type {
  APLAT_T_WC_DIADIKASIA_CALENDAR,
  CustomerContactItem,
  PhoneContactItem,
} from "@/types/api/schemas";

/** Normalized WC calendar row for UI (required display fields). */
export type wcCalendar = APLAT_T_WC_DIADIKASIA_CALENDAR & {
  customerCode: string;
  customer_GID?: string;
  customerGID?: string;
  customerName: string;
  sellerCode: string;
  sellerName: string;
  lastPAEO: string;
  task_CODE?: string;
  lastOrderDate: string;
  expectedNextOrderDate: string;
  datesInfo: string;
  daysUntilReminder: number;
  doctoR_SINTAGHS: string;
  docT_GRLSH: string;
  items: string;
  totalTurnover: number;
  pasy: number;
  totaL_EXP: number;
  ordersCount: number;
  plethos: number;
  team: string;
  area: string;
  statuS_EA: string;
};

export function wcCalendarTaskCode(r: wcCalendar): string {
  return (r.tasK_CODE ?? r.task_CODE ?? "").trim();
}

export function wcCustomerGid(r: wcCalendar): string {
  return (r.customer_GID ?? r.customerGID ?? "").trim();
}

/** `data` from `GET /api/search-customer-tels`. */
export type SearchCustomerTelsPhone = PhoneContactItem & {
  name: string;
  phone: string;
};

export type SearchCustomerTelsData = Required<
  Pick<CustomerContactItem, "customerAMKA" | "customerGID" | "customerName">
> & {
  telephones: SearchCustomerTelsPhone[];
  emails: string[];
};
