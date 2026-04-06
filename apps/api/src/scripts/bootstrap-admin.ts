import { and, eq } from 'drizzle-orm';

import { roles, staffAccounts, staffRoleBindings, users } from '@rebase/db';

import { getAuth } from '../lib/auth.js';
import { getDb } from '../lib/db.js';
import { isAuthConfigured } from '../lib/env.js';

const adminEmail = process.env.DEV_ADMIN_EMAIL ?? 'admin@rebase.local';
const adminPassword = process.env.DEV_ADMIN_PASSWORD ?? 'RebaseAdmin123456!';
const adminName = process.env.DEV_ADMIN_NAME ?? 'Rebase Super Admin';

const main = async () => {
  if (!isAuthConfigured()) {
    throw new Error('DATABASE_URL and BETTER_AUTH_SECRET are required before bootstrapping the admin account.');
  }

  const auth = getAuth();
  if (!auth) {
    throw new Error('Better Auth is not configured.');
  }

  const db = getDb();

  let user = (await db.select().from(users).where(eq(users.email, adminEmail)).limit(1))[0] ?? null;

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      },
    });

    user = (await db.select().from(users).where(eq(users.email, adminEmail)).limit(1))[0] ?? null;
  }

  if (!user) {
    throw new Error('Unable to create or load the admin user.');
  }

  let staffAccount = (await db.select().from(staffAccounts).where(eq(staffAccounts.userId, user.id)).limit(1))[0] ?? null;

  if (!staffAccount) {
    staffAccount = (
      await db
        .insert(staffAccounts)
        .values({
          userId: user.id,
          status: 'active',
          displayName: adminName,
          invitedAt: new Date(),
          activatedAt: new Date(),
          notes: 'bootstrapped development super admin',
        })
        .returning()
    )[0] ?? null;
  }

  if (!staffAccount) {
    throw new Error('Unable to create or load the staff account.');
  }

  const role = (await db.select().from(roles).where(eq(roles.code, 'super_admin')).limit(1))[0] ?? null;
  if (!role) {
    throw new Error('super_admin role is missing. Run the seed script first.');
  }

  const binding = (
    await db
      .select()
      .from(staffRoleBindings)
      .where(and(eq(staffRoleBindings.staffAccountId, staffAccount.id), eq(staffRoleBindings.roleId, role.id)))
      .limit(1)
  )[0];

  if (!binding) {
    await db.insert(staffRoleBindings).values({
      staffAccountId: staffAccount.id,
      roleId: role.id,
    });
  }

  console.log(
    JSON.stringify(
      {
        email: adminEmail,
        password: adminPassword,
        userId: user.id,
        staffAccountId: staffAccount.id,
        role: role.code,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
