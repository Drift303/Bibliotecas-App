const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenants...');

  const tenants = [
    {
      name: 'Escuela Ejemplo Activa',
      emailDomain: 'activa.edu.mx',
      status: 'ACTIVE'
    },
    {
      name: 'Escuela Ejemplo Suspendida',
      emailDomain: 'suspendida.edu.mx',
      status: 'SUSPENDED'
    }
  ];

  for (const t of tenants) {
    await prisma.tenant.upsert({
      where: { emailDomain: t.emailDomain },
      update: { name: t.name, status: t.status },
      create: t
    });
  }

  const all = await prisma.tenant.findMany();
  console.log('Tenants in DB:', all);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
