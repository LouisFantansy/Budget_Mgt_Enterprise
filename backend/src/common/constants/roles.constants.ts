export const RoleCodes = {
  RD_BUDGET_ADMIN: 'RD_BUDGET_ADMIN',
  RD_MANAGER: 'RD_MANAGER',
  PROCUREMENT: 'PROCUREMENT',
  FINANCE: 'FINANCE',
  SYS_ADMIN: 'SYS_ADMIN',
} as const;

export type RoleCode = (typeof RoleCodes)[keyof typeof RoleCodes];

export function canViewPoPrice(roleCodes: string[] | undefined | null): boolean {
  if (!roleCodes || roleCodes.length === 0) return false;
  return (
    roleCodes.includes(RoleCodes.PROCUREMENT) ||
    roleCodes.includes(RoleCodes.FINANCE) ||
    roleCodes.includes(RoleCodes.SYS_ADMIN)
  );
}

