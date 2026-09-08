import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/modules/tenants/types";

const ACTIVE_TENANT_COOKIE = "active_tenant_id";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  isSuperAdmin: boolean;
}

/**
 * Requires an authenticated user. Reloads user status/isSuperAdmin from the
 * database on every call — the JWT only carries the user id, so a
 * suspension or a super-admin grant takes effect immediately.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.orm.public.User.first({ id: session.user.id });
  if (!user || user.status !== "ACTIVE") {
    redirect("/login");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
  };
}

export interface MembershipWithTenant {
  membershipId: string;
  role: Role;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

export async function listMemberships(
  userId: string
): Promise<MembershipWithTenant[]> {
  const memberships = await db.orm.public.Membership.where({
    userId,
  }).include("tenant").all();

  return memberships.map((m) => ({
    membershipId: m.id,
    role: m.role as Role,
    tenant: {
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      status: m.tenant.status,
    },
  }));
}

export interface CurrentTenantContext {
  tenant: { id: string; name: string; slug: string; status: string };
  role: Role;
}

/**
 * Resolves the tenant the current request should operate on.
 *
 * The tenant is NEVER trusted from client input — it is derived from an
 * httpOnly cookie that only stores a tenant id, which is then verified
 * against the user's own memberships in the database on every call. A
 * cookie pointing at a tenant the user no longer belongs to is ignored.
 */
export async function getCurrentTenant(
  userId: string
): Promise<CurrentTenantContext | null> {
  const memberships = await listMemberships(userId);
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;

  const match =
    memberships.find((m) => m.tenant.id === requestedId) ?? memberships[0];

  return { tenant: match.tenant, role: match.role };
}

export async function requireTenant(
  userId: string
): Promise<CurrentTenantContext> {
  const ctx = await getCurrentTenant(userId);
  if (!ctx) {
    redirect("/onboarding");
  }
  return ctx;
}

export async function setActiveTenantCookie(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

const ROLE_RANK: Record<Role, number> = {
  STAFF: 1,
  MANAGER: 2,
  OWNER: 3,
};

/** Redirects away when the current membership role is below `minimum`. */
export function assertRole(role: Role, minimum: Role) {
  if (ROLE_RANK[role] < ROLE_RANK[minimum]) {
    redirect("/dashboard");
  }
}
