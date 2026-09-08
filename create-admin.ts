import { Temporal } from "@js-temporal/polyfill";
Object.assign(globalThis, { Temporal });
import { db } from "./src/lib/db";
import { hashPassword } from "./src/lib/security/password";

async function main() {
  const email = "admin@webpanel.com";
  const password = "admin";
  const passwordHash = await hashPassword(password);

  console.log("Checking if admin user exists...");
  let user = await db.orm.public.User.first({ email });

  if (!user) {
    console.log("Creating admin user...");
    user = await db.orm.public.User.create({
      email,
      passwordHash,
      name: "Super Admin",
      isSuperAdmin: true,
      status: "ACTIVE",
    });
  } else {
    console.log("Admin user already exists. Updating password and permissions...");
    await db.orm.public.User.update(
      { id: user.id },
      { passwordHash, isSuperAdmin: true, status: "ACTIVE" }
    );
  }

  console.log("Checking for default tenant...");
  let tenant = await db.orm.public.Tenant.first({ slug: "loja-admin" });

  if (!tenant) {
    console.log("Creating default tenant...");
    tenant = await db.orm.public.Tenant.create({
      name: "Loja do Admin",
      slug: "loja-admin",
      status: "ACTIVE",
    });
    
    // Create mini app settings
    await db.orm.public.MiniAppSettings.create({
      tenantId: tenant.id,
      storeName: "Loja do Admin",
      primaryColor: "#18181b",
      secondaryColor: "#09090b",
    });
  }

  console.log("Ensuring membership...");
  const membership = await db.orm.public.Membership.first({
    userId: user.id,
    tenantId: tenant.id,
  });

  if (!membership) {
    await db.orm.public.Membership.create({
      userId: user.id,
      tenantId: tenant.id,
      role: "OWNER",
    });
  }

  console.log("=====================================================");
  console.log("✅ Admin access created successfully!");
  console.log("📧 E-mail: admin@webpanel.com");
  console.log("🔑 Senha:  admin");
  console.log("=====================================================");
}

main().catch(console.error).finally(() => process.exit(0));
