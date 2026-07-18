// /lib/backend/permissions.ts

export const BACKEND_PERMISSIONS = {
  USERS: 'backend.users',

  EVENTS: 'backend.events',
  SEATINGS: 'backend.seatings',

  RESERVATIONS: 'backend.reservations',
  RESERVATION_SEARCH: 'backend.reservations.search',
  RESERVATION_TABLE_NUMBERS: 'backend.reservations.tableNumbers',
  COMPANY_RESERVATIONS: 'backend.reservations.company',
  FRIENDS_FAMILY: 'backend.reservations.friendsFamily',
  RESERVATION_EXPORT: 'backend.reservations.export',

  DASHBOARD: 'backend.dashboard',
  INVOICES: 'backend.invoices',

  REFERRAL_CODES: 'backend.referralCodes',
  SPECIAL_EVENTS: 'backend.specialEvents',
  NEWSLETTER: 'backend.newsletter',
  IMPRESSIONS: 'backend.impressions',
} as const;

export type BackendPermissionKey =
  (typeof BACKEND_PERMISSIONS)[keyof typeof BACKEND_PERMISSIONS];

export const ALL_BACKEND_PERMISSIONS = Object.values(
  BACKEND_PERMISSIONS,
) as BackendPermissionKey[];

const BACKEND_PERMISSION_SET = new Set<string>(ALL_BACKEND_PERMISSIONS);

export function isBackendPermissionKey(
  value: unknown,
): value is BackendPermissionKey {
  return typeof value === 'string' && BACKEND_PERMISSION_SET.has(value);
}

export function sanitizeBackendPermissions(
  permissions: unknown,
): BackendPermissionKey[] {
  if (!Array.isArray(permissions)) return [];

  return Array.from(new Set(permissions.filter(isBackendPermissionKey)));
}
