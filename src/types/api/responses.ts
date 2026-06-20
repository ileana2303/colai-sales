import type { ApiFailure, ApiSuccess } from "./common";
import type { ApiUserInfo, LoginResp } from "./schemas";

type Success<T> = Extract<T, { ok: true }>;

/** `POST /api/auth/login` */
export type LoginResponse = ApiSuccess<LoginResp> | ApiFailure;
export type LoginSuccess = Extract<LoginResponse, { ok: true }>;
export type LoginFailure = Extract<LoginResponse, { ok: false }>;

/** `GET /api/auth/me` */
export type AuthMeResponse =
  | ApiSuccess<{
      authenticated: boolean;
      userInfos?: ApiUserInfo | null;
      user?: { username?: string };
    }>
  | ApiFailure;

export type AuthMeSuccess = Success<AuthMeResponse>;
