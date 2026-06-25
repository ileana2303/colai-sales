import type { ApiUserInfo } from "@/types/api/schemas";

/** Slim profile stored in the session cookie (avoids 4KB browser limit). */
export type SessionUserInfo = Pick<
  ApiUserInfo,
  | "userID"
  | "userUID"
  | "username"
  | "fname"
  | "lname"
  | "area"
  | "team"
  | "isSuperAdmin"
  | "isSalesAdmin"
  | "isSeller"
  | "isManager"
  | "sellerCode"
  | "travmaArea"
  | "travmaTeam"
>;

export function toSessionUserInfo(
  userInfos: ApiUserInfo | null | undefined,
): SessionUserInfo | null {
  if (!userInfos || typeof userInfos.userID !== "number") return null;

  return {
    userID: userInfos.userID,
    userUID: userInfos.userUID ?? null,
    username: userInfos.username ?? null,
    fname: userInfos.fname ?? null,
    lname: userInfos.lname ?? null,
    area: userInfos.area ?? null,
    team: userInfos.team ?? null,
    isSuperAdmin: userInfos.isSuperAdmin,
    isSalesAdmin: userInfos.isSalesAdmin,
    isSeller: userInfos.isSeller,
    isManager: userInfos.isManager,
    sellerCode: userInfos.sellerCode ?? null,
    travmaArea: userInfos.travmaArea ?? null,
    travmaTeam: userInfos.travmaTeam ?? null,
  };
}
