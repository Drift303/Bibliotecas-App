const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenants, users and books...');

  const saltRounds = 10;

  // Tenants
  const tenantActive = await prisma.tenant.upsert({
    where: { emailDomain: 'activa.edu.mx' },
    update: { name: 'Escuela Ejemplo Activa', status: 'ACTIVE' },
    create: { name: 'Escuela Ejemplo Activa', emailDomain: 'activa.edu.mx', status: 'ACTIVE' },
  });

  const tenantSuspended = await prisma.tenant.upsert({
    where: { emailDomain: 'suspendida.edu.mx' },
    update: { name: 'Escuela Ejemplo Suspendida', status: 'SUSPENDED' },
    create: { name: 'Escuela Ejemplo Suspendida', emailDomain: 'suspendida.edu.mx', status: 'SUSPENDED' },
  });

  // Users (one librarian and one student per tenant)
  const users = [
    {
      tenantId: tenantActive.id,
      name: 'Ana Bibliotecaria',
      email: 'ana@activa.edu.mx',
      cct: 'CCT-ACT-001',
      studentId: null,
      department: 'Library',
      barcode: 'LIB-ACT-001',
      password: await bcrypt.hash('Password123!', saltRounds),
      role: 'librarian',
    },
    {
      tenantId: tenantActive.id,
      name: 'Luis Alumno',
      email: 'luis@activa.edu.mx',
      cct: 'CCT-ACT-STU-01',
      studentId: 'STU-ACT-0001',
      department: 'Primaria',
      barcode: 'BAR-ACT-0001',
      password: await bcrypt.hash('Alumno123!', saltRounds),
      role: 'student',
    },
    {
      tenantId: tenantSuspended.id,
      name: 'María Bibliotecaria',
      email: 'maria@suspendida.edu.mx',
      cct: 'CCT-SUS-001',
      studentId: null,
      department: 'Library',
      barcode: 'LIB-SUS-001',
      password: await bcrypt.hash('Password123!', saltRounds),
      role: 'librarian',
    },
    {
      tenantId: tenantSuspended.id,
      name: 'Pedro Alumno',
      email: 'pedro@suspendida.edu.mx',
      cct: 'CCT-SUS-STU-01',
      studentId: 'STU-SUS-0001',
      department: 'Secundaria',
      barcode: 'BAR-SUS-0001',
      password: await bcrypt.hash('Alumno123!', saltRounds),
      role: 'student',
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findFirst({ where: { tenantId: u.tenantId, email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { name: u.name, cct: u.cct, studentId: u.studentId, department: u.department, barcode: u.barcode, password: u.password, role: u.role } });
    } else {
      await prisma.user.create({ data: { tenantId: u.tenantId, name: u.name, email: u.email, cct: u.cct, studentId: u.studentId, department: u.department, barcode: u.barcode, password: u.password, role: u.role } });
    }
  }

  // Books for active tenant
  const booksData = [
    { title: 'Cien años de soledad', author: 'Gabriel García Márquez', locationHall: 'A', locationShelf: '1', isbn: '9780307474728', publisher: 'Random House' },
    { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', locationHall: 'A', locationShelf: '2', isbn: '9788491050257', publisher: 'Alfaguara' },
    { title: 'La Odisea', author: 'Homero', locationHall: 'B', locationShelf: '1', isbn: '9788420678598', publisher: 'Gredos' },
    { title: 'El Principito', author: 'Antoine de Saint-Exupéry', locationHall: 'B', locationShelf: '3', isbn: '9780156013987', publisher: 'Reynal & Hitchcock' },
    { title: '1984', author: 'George Orwell', locationHall: 'C', locationShelf: '1', isbn: '9780451524935', publisher: 'Secker & Warburg' },
  ];

  for (const b of booksData) {
    const existingBook = await prisma.book.findFirst({ where: { tenantId: tenantActive.id, title: b.title } });
    if (existingBook) {
      await prisma.book.update({ where: { id: existingBook.id }, data: { author: b.author, isbn: b.isbn, publisher: b.publisher, locationHall: b.locationHall, locationShelf: b.locationShelf } });
    } else {
      await prisma.book.create({ data: {
        tenantId: tenantActive.id,
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publisher: b.publisher,
        locationHall: b.locationHall,
        locationShelf: b.locationShelf,
        statusPhysical: 'GOOD',
        statusLogical: 'ACTIVE',
        available: true,
      } });
    }
  }

  console.log('Seeding finished. Tenants, users and books created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
