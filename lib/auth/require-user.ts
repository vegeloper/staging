import { redirect } from "next/navigation";

import {
  canAccessCms,
  canManagePositions,
  canManageSite,
  canManageSubmissions,
  homePathForRole,
} from "./rbac";
import { readSessionUser, type AuthUser } from "./session";

export async function requireUser(returnTo = "/admin"): Promise<AuthUser> {
  const user = await readSessionUser();
  if (user) return user;

  const safeReturnTo = returnTo.startsWith("/admin") ? returnTo : "/admin";
  redirect(`/admin/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
}

export async function requireInboxUser(): Promise<AuthUser> {
  const user = await requireUser("/admin/submissions");
  if (!canManageSubmissions(user.role)) redirect(homePathForRole(user.role));
  return user;
}

export async function requirePositionsUser(returnTo: string): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (!canManagePositions(user.role)) redirect(homePathForRole(user.role));
  return user;
}

export async function requireCmsUser(returnTo: string): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (!canAccessCms(user.role)) redirect(homePathForRole(user.role));
  return user;
}

export async function requireAdminUser(returnTo: string): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (!canManageSite(user.role)) redirect(homePathForRole(user.role));
  return user;
}
