export interface AdminSessionGuardResult {
  data?: unknown;
}

export const resolveAdminRouteAccess = async (
  requiresAuth: boolean | undefined,
  getSession: () => Promise<AdminSessionGuardResult | null | undefined>,
) => {
  if (!requiresAuth) {
    return true;
  }

  try {
    const session = await getSession();
    if (!session?.data) {
      return { name: 'login' };
    }
  } catch {
    return { name: 'login' };
  }

  return true;
};
