import { adminModules, type AdminMePayload } from '@rebase/shared';

export const getVisibleAdminModules = (me?: AdminMePayload | null, loading = false) => {
  if (loading || !me) {
    return adminModules;
  }

  const permissions = new Set(me.permissions);

  return adminModules.filter((module) => {
    if (!module.permission) {
      return true;
    }

    return permissions.has(module.permission) || me.roles.includes('super_admin');
  });
};
