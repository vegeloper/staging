import { redirect } from "next/navigation";

import { canAccessCms, canManageSubmissions } from "./rbac";
import { readSessionUser, type AuthUser } from "./session";

export async function requireUser(returnTo = "/admin"): Promise<AuthUser> {
  const user = await readSessionUser();
  if (user) return user;

  const safeReturnTo = returnTo.startsWith("/admin") ? returnTo : "/admin";
  redirect(`/admin/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
}

export async function requireInboxUser(): Promise<AuthUser> {
  const user = await requireUser("/admin");
  if (!canManageSubmissions(user.role)) redirect("/admin/content");
  return user;
}

export async function requireCmsUser(returnTo: string): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (!canAccessCms(user.role)) redirect("/admin");
  return user;
}
