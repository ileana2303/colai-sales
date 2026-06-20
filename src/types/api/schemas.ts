/**
 * AMSA API schema types used for authentication.
 */

import type { Nullable } from "./common";

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
