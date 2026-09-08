import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./db";

async function main() {
  console.log("Seeding structural data...");

  await db.orm.public.Plan.upsert({
    create: {
      name: "STARTER",
      price: 29.9,
      currency: "BRL",
      features: { maxBots: 1, maxProducts: 10, maxCustomers: 100 },
    },
    update: {
      price: 29.9,
      features: { maxBots: 1, maxProducts: 10, maxCustomers: 100 },
    },
    conflictOn: { name: "STARTER" },
  });

  await db.orm.public.Plan.upsert({
    create: {
      name: "PRO",
      price: 59.9,
      currency: "BRL",
      features: { maxBots: 3, maxProducts: 50, maxCustomers: 1000 },
    },
    update: {
      price: 59.9,
      features: { maxBots: 3, maxProducts: 50, maxCustomers: 1000 },
    },
    conflictOn: { name: "PRO" },
  });

  await db.orm.public.Plan.upsert({
    create: {
      name: "BUSINESS",
      price: 99.9,
      currency: "BRL",
      features: { maxBots: 10, maxProducts: -1, maxCustomers: -1 },
    },
    update: {
      price: 99.9,
      features: { maxBots: 10, maxProducts: -1, maxCustomers: -1 },
    },
    conflictOn: { name: "BUSINESS" },
  });

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.warn(
      "SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin creation. " +
        "Set them in .env to seed the initial platform administrator."
    );
  } else {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12);
    await db.orm.public.User.upsert({
      create: {
        email: superAdminEmail,
        name: "Super Admin",
        passwordHash,
        status: "ACTIVE",
        isSuperAdmin: true,
      },
      update: {
        passwordHash,
        isSuperAdmin: true,
      },
      conflictOn: { email: superAdminEmail },
    });
    console.log(`Super admin ready: ${superAdminEmail}`);
  }

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
