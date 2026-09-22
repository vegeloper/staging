export const userRoles = ["admin", "operator", "content_creator"] as const;

export type UserRole = (typeof userRoles)[number];

export function canManageSubmissions(role: UserRole) {
  return role === "admin" || role === "operator";
}

export function canAccessCms(role: UserRole) {
  return role === "admin" || role === "content_creator";
}

export function canReviewContent(role: UserRole) {
  return role === "admin";
}

export function canManageSite(role: UserRole) {
  return role === "admin";
}

export function homePathForRole(role: UserRole) {
  if (role === "content_creator") return "/admin/content";
  if (role === "operator") return "/admin/submissions";
  return "/admin";
}

export function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export function destinationForRole(role: UserRole, requested: string) {
  const home = homePathForRole(role);
  const destination = isAdminPath(requested) && !requested.startsWith("/admin/login")
    ? requested
    : home;
  if (role === "admin") return destination;
  if (role === "operator") {
    return destination === "/admin/submissions" || destination.startsWith("/admin/submissions/")
      ? destination
      : "/admin/submissions";
  }
  return destination === "/admin/content" || destination.startsWith("/admin/content/")
    ? destination
    : "/admin/content";
}

export function roleLabel(role: UserRole) {
  if (role === "admin") return "مدیر وب‌سایت";
  if (role === "content_creator") return "تولیدکننده محتوا";
  return "اپراتور";
}
