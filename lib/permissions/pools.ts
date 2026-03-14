type PoolMemberRole = "leader" | "member";

// --- Pool Actions (server actions / mutations) ---

export type PoolAction =
  | "update-settings"
  | "delete-pool"
  | "create-invite"
  | "delete-invite"
  | "change-member-role"
  | "remove-member"
  | "send-user-invite"
  | "cancel-user-invite";

const poolActionPermissions: Record<PoolAction, Set<PoolMemberRole>> = {
  "update-settings": new Set(["leader"]),
  "delete-pool": new Set(["leader"]),
  "create-invite": new Set(["leader"]),
  "delete-invite": new Set(["leader"]),
  "change-member-role": new Set(["leader"]),
  "remove-member": new Set(["leader"]),
  "send-user-invite": new Set(["leader", "member"]),
  "cancel-user-invite": new Set(["leader", "member"]),
};

export function canPerformPoolAction(
  role: PoolMemberRole,
  action: PoolAction,
): boolean {
  return poolActionPermissions[action].has(role);
}

// --- Pool Pages (read access / visibility) ---

export type PoolPage = "detail" | "settings";
// Future pages will be added here as stories are implemented

const poolPagePermissions: Record<PoolPage, Set<PoolMemberRole>> = {
  detail: new Set(["leader", "member"]),
  settings: new Set(["leader"]),
};

export function canAccessPoolPage(
  role: PoolMemberRole,
  page: PoolPage,
): boolean {
  return poolPagePermissions[page].has(role);
}
