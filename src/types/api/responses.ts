import type { ApiFailure, ApiSuccess, Nullable } from "./common";
import type { SellerSalesWC, SellerTeamatesWC } from "./sqlData";
import type {
  CustomerContactItem,
  GenikiTaxTrackResponse,
  LoginResp,
  WCdiadikasiaGetDataVM,
} from "./schemas";

type Success<T> = Extract<T, { ok: true }>;

/** `GET /api/search-customer-tels` */
export type SearchCustomerTelsResponse =
  | ApiSuccess<{ data: CustomerContactItem; statusCode?: Nullable<number> }>
  | ApiFailure;

/** `GET /api/wc-diadikasia/calendar` */
export type GetWcCalendarResponse =
  | ApiSuccess<WCdiadikasiaGetDataVM>
  | ApiFailure;

/** `GET /api/wc/order-list` */
export type GetWcOrderListResponse =
  | ApiSuccess<{ records: SellerSalesWC[] }>
  | ApiFailure;

/** `GET /api/wc/teamates` */
export type GetWcTeamatesResponse =
  | ApiSuccess<{ records: SellerTeamatesWC[] }>
  | ApiFailure;

/** `GET /api/gt-track-and-trace` */
export type GetGtTrackAndTraceResponse =
  | ApiSuccess<GenikiTaxTrackResponse>
  | ApiFailure;

/** `POST /api/auth/login` */
export type LoginResponse = ApiSuccess<LoginResp> | ApiFailure;
export type LoginSuccess = Extract<LoginResponse, { ok: true }>;
export type LoginFailure = Extract<LoginResponse, { ok: false }>;

/** `GET /api/auth/me` */
export type AuthMeResponse =
  | ApiSuccess<{
      authenticated: boolean;
      user?: { username?: string };
    }>
  | ApiFailure;

export type SearchCustomerTelsSuccess = Success<SearchCustomerTelsResponse>;
export type GetWcCalendarSuccess = Success<GetWcCalendarResponse>;
export type GetWcOrderListSuccess = Success<GetWcOrderListResponse>;
export type GetWcTeamatesSuccess = Success<GetWcTeamatesResponse>;
export type GetGtTrackAndTraceSuccess = Success<GetGtTrackAndTraceResponse>;
export type AuthMeSuccess = Success<AuthMeResponse>;

export type {
  Checkpoint,
  GenikiTaxTrackResponse,
  TrackAndTraceResult,
} from "./schemas";
