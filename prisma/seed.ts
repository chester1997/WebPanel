import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // Planos da Plataforma
  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan_starter' },
    update: {},
    create: {
      id: 'plan_starter',
      name: 'STARTER',
      price: 29.90,
      features: {
        maxBots: 1,
        maxProducts: 10,
        maxCustomers: 100
      }
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'PRO',
      price: 59.90,
      features: {
        maxBots: 3,
        maxProducts: 50,
        maxCustomers: 1000
      }
    }
  })

  const businessPlan = await prisma.plan.upsert({
    where: { id: 'plan_business' },
    update: {},
    create: {
      id: 'plan_business',
      name: 'BUSINESS',
      price: 99.90,
      features: {
        maxBots: 10,
        maxProducts: -1, // ilimitado
        maxCustomers: -1
      }
    }
  })

  // Super Admin Inicial
  const adminEmail = 'admin@platform.com'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Admin',
      // Em produção, a senha deve ser hasheada! (ex: bcrypt)
      // Aqui usamos apenas para scaffold. Na vida real usar NextAuth Credentials
      passwordHash: 'TODO_HASHED_PASSWORD',
      status: 'ACTIVE'
    }
  })

  // Criar um tenant vazio de scaffold se não existir
  // Para que não haja um if tenant === "studio-shorts" no código da app, 
  // nós apenas criamos um genérico no seed para testes
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'studio-shorts' }, // Esse slug é apenas para o seed, não hardcode na app!
    update: {},
    create: {
      name: 'Studio Shorts',
      slug: 'studio-shorts',
      status: 'ACTIVE'
    }
  })

  // Vincular admin como OWNER do tenant de seed (exemplo)
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: admin.id, tenantId: defaultTenant.id } },
    update: {},
    create: {
      userId: admin.id,
      tenantId: defaultTenant.id,
      role: 'OWNER'
    }
  })

  console.log('Seed finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
