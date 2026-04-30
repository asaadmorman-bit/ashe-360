/**
 * Role-based access control for EDS-360.
 * Each nav item lists which roles can see it.
 * Omitting `roles` means ALL authenticated users can see it.
 * Roles: admin, soc_manager, issm, incident_response, threat_hunter,
 *        threat_intelligence, system_admin, system_engineer,
 *        firewall_engineer, firewall_admin, project_manager, it_support, user
 */

export const SOC_ROLES = [
  'admin', 'soc_manager', 'issm', 'incident_response',
  'threat_hunter', 'threat_intelligence',
];

export const ENGINEER_ROLES = [
  'admin', 'soc_manager', 'issm', 'system_admin', 'system_engineer',
  'firewall_engineer', 'firewall_admin', 'threat_hunter',
];

export const COMPLIANCE_ROLES = [
  'admin', 'soc_manager', 'issm', 'system_admin', 'system_engineer',
  'threat_hunter', 'incident_response', 'threat_intelligence',
  'project_manager',
];

export const MANAGEMENT_ROLES = [
  'admin', 'soc_manager', 'issm', 'project_manager',
];

export const INTEL_ROLES = [
  'admin', 'soc_manager', 'issm', 'threat_hunter', 'threat_intelligence',
  'incident_response',
];

/** Nav item access map: path → allowed roles (undefined = all authed users) */
export const NAV_ACCESS = {
  '/dashboard':        undefined,                          // everyone
  '/conmon':           SOC_ROLES,                          // SOC + leadership
  '/eye':              [...SOC_ROLES, 'system_admin', 'system_engineer', 'firewall_engineer', 'firewall_admin'],
  '/threat-intel':     INTEL_ROLES,
  '/security-health':  COMPLIANCE_ROLES,
  '/ato':              COMPLIANCE_ROLES,
  '/growth':           ['admin', 'soc_manager', 'project_manager', 'issm'],
  '/social':           ['admin', 'soc_manager', 'project_manager'],
  '/training':         undefined,                          // everyone
  '/exec':             MANAGEMENT_ROLES,
  '/platform':         ['admin', 'soc_manager', 'issm', 'system_admin', 'system_engineer'],
  '/qa':               ['admin', 'soc_manager', 'issm', 'project_manager', 'system_admin', 'system_engineer'],
  '/onboarding':       ['admin', 'soc_manager', 'issm', 'project_manager', 'it_support'],
  '/directory':        undefined, // all authenticated users
};

/** Returns true if the given role can access the given path */
export function canAccess(role, path) {
  const allowed = NAV_ACCESS[path];
  if (!allowed) return true; // open to all authenticated users
  return allowed.includes(role);
}