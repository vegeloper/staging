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

export function homePathForRole(role: UserRole) {
  return role === "content_creator" ? "/admin/content" : "/admin";
}

export function roleLabel(role: UserRole) {
  if (role === "admin") return "مدیر وب‌سایت";
  if (role === "content_creator") return "تولیدکننده محتوا";
  return "اپراتور";
}
