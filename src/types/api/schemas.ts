/**
 * AMSA API schema types used by the sales desktop app.
 */

import type { Nullable } from "./common";

export type APLAT_T_WC_DIADIKASIA_CALENDAR = {
  customerCode?: Nullable<string>;
  customerName?: Nullable<string>;
  peL_GRLSH?: Nullable<string>;
  amka?: Nullable<string>;
  sellerCode?: Nullable<string>;
  sellerName?: Nullable<string>;
  lastPAEO?: Nullable<string>;
  tasK_CODE?: Nullable<string>;
  task_CODE?: Nullable<string>;
  lastOrderDate?: Nullable<string>;
  expectedNextOrderDate?: Nullable<string>;
  datesInfo?: Nullable<string>;
  daysUntilReminder?: Nullable<number>;
  doctoR_SINTAGHS?: Nullable<string>;
  docT_GRLSH?: Nullable<string>;
  deliveryAddress1?: Nullable<string>;
  deliveryCity?: Nullable<string>;
  deliveryPostal?: Nullable<string>;
  items?: Nullable<string>;
  totalTurnover?: Nullable<number>;
  pasy?: Nullable<number>;
  totaL_EXP?: Nullable<number>;
  ordersCount?: Nullable<number>;
  plethos?: Nullable<number>;
  team?: Nullable<string>;
  area?: Nullable<string>;
  statuS_EA?: Nullable<string>;
  statuS_CUST?: Nullable<string>;
};

export type AplatReportCustomerStatus = {
  statusId: number;
  statusUID?: Nullable<string>;
  title?: Nullable<string>;
  dateIn?: Nullable<string>;
  dateUpdated?: Nullable<string>;
  displayRank?: Nullable<number>;
};

export type WCdiadikasiaGetDataVM = {
  statusCode?: Nullable<number>;
  message?: Nullable<string>;
  detailedMessage?: Nullable<string>;
  showActions: boolean;
  listData?: Nullable<APLAT_T_WC_DIADIKASIA_CALENDAR[]>;
  listStatuses?: Nullable<AplatReportCustomerStatus[]>;
};

export type PhoneContactItem = {
  name?: Nullable<string>;
  phone?: Nullable<string>;
  isFromCustomer: boolean;
};

export type CustomerContactItem = {
  customerAMKA?: Nullable<string>;
  customerGID?: Nullable<string>;
  customerName?: Nullable<string>;
  telephones?: Nullable<PhoneContactItem[]>;
  emails?: Nullable<string[]>;
};

export type StoxoiMina = {
  count_paragg_new: number;
  count_paragg_repeat: number;
  amount_paragg_new: number;
  amount_paragg_repeat: number;
};

export type ApiAccessSellerItem = {
  sellerCode?: Nullable<string>;
  sellerName?: Nullable<string>;
};

export type ApiAccessAreaTeamItem = {
  name?: Nullable<string>;
  value?: Nullable<string>;
};

export type ApiAvailableAiClient = {
  name?: Nullable<string>;
  code?: Nullable<string>;
  priority: number;
};

export type AiClient = ApiAvailableAiClient;

export type ApiUserInfo = {
  userID: number;
  userUID?: Nullable<string>;
  username?: Nullable<string>;
  fname?: Nullable<string>;
  lname?: Nullable<string>;
  area?: Nullable<string>;
  team?: Nullable<string>;
  isSuperAdmin: boolean;
  isSalesAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  sellerCode?: Nullable<string>;
  listAccessSellers?: Nullable<ApiAccessSellerItem[]>;
  listAccessAreaTeam?: Nullable<ApiAccessAreaTeamItem[]>;
  travmaArea?: Nullable<string>;
  travmaTeam?: Nullable<string>;
};

export type LoginReq = {
  username?: Nullable<string>;
  password?: Nullable<string>;
};

export type LoginResp = {
  statusCode?: Nullable<number>;
  message?: Nullable<string>;
  detailedMessage?: Nullable<string>;
  accessToken?: Nullable<string>;
  tokenType?: Nullable<string>;
  expiresIn?: Nullable<number>;
  userInfos?: Nullable<ApiUserInfo>;
  warningMessage?: Nullable<string>;
  availableAiClients?: Nullable<AiClient[]>;
};

export type Checkpoint = {
  status?: Nullable<string>;
  statusCode?: Nullable<string>;
  statusDate: string;
  shop?: Nullable<string>;
  latitude: number;
  longitude: number;
};

export type TrackAndTraceResult = {
  result: number;
  checkpoints?: Nullable<Checkpoint[]>;
  status?: Nullable<string>;
  deliveryDate: string;
  consignee?: Nullable<string>;
  returningServiceVoucher?: Nullable<string>;
  deliveredAt?: Nullable<string>;
};

export type GenikiTaxTrackResponse = {
  isSuccess: boolean;
  message?: Nullable<string>;
  errorMessage?: Nullable<string>;
  tracking_info?: Nullable<TrackAndTraceResult>;
};
