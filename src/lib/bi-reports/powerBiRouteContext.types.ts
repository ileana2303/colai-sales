import type { ApiUserInfo } from "@/types/api/schemas";
import type { ResolvedReportSellerContext } from "@/lib/bi-reports/sellers.types";
import type { NextResponse } from "next/server";

export type PowerBiRouteAuthSuccess = {
  ok: true;
  token: string;
  userInfo: ApiUserInfo | null;
  reportContext: ResolvedReportSellerContext;
};

export type PowerBiRouteAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type PowerBiRouteAuthResult =
  | PowerBiRouteAuthSuccess
  | PowerBiRouteAuthFailure;
