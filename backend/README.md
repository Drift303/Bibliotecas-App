# Backend - Bibliotecas App

## 📋 Resumen Ejecutivo

**Arquitectura Modular Clean Architecture**: código estructurado en `/src` con separación clara de responsabilidades.
- **ORM**: Prisma + PostgreSQL con modelo multi-tenant strict (aislamiento por `tenantId` en todas las entidades).
- **Seguridad Multi-capa**: JWT en cookie HttpOnly, RBAC (`roleGuard`), SaaS Guard (bloquea tenants suspendidos), validación Zod.
- **Transacciones Atómicas**: operaciones críticas (sync loans, create/return loan) usan `prisma.$transaction`.

---

## 🔧 Cambios Recientes (v0.2.0)

### ✨ Agregado

| Componente | Archivo | Propósito |
|---|---|---|
| **RBAC Middleware** | `src/middlewares/roleGuard.js` | Verifica roles de usuario (student, librarian, admin_plantel, superadmin); bloquea acceso con 403 si no autorizado |
| **User Management** | `src/controllers/userController.js` | CRUD de usuarios: listado, creación, actualización, eliminación lógica (`isDeleted = true`) |
| **User Validators** | `src/validators/userValidators.js` | Esquemas Zod para validar creación/actualización: `name`, `email`, `role`, `studentId`, `department`, `barcode` |
| **User Routes** | `src/routes/userRoutes.js` | Endpoints `/api/users` (GET, POST, PUT `/:id`, DELETE `/:id`) con protección RBAC |
| **Schema Updates** | `prisma/schema.prisma` | Nuevos campos User: `studentId`, `department`, `barcode`, `isDeleted`; Book: `publisher`, `locationHall`, `locationShelf`, `statusPhysical`, `statusLogical`, `available`; Loan: `dueDate`, `fineAmount` |
| **Relations** | `prisma/schema.prisma` | Agregadas relaciones inversas: `Tenant.users[]`, `Tenant.books[]`, `Tenant.loans[]`, `User.loans[]`, `Book.loans[]` |
| **Postman Endpoints** | `postman_collection.json` | Carpeta "Users" con requests: list, create valid, create invalid, test RBAC |

### ❌ Eliminado

| Componente | Razón |
|---|---|
| Endpoints sin autenticación | Seguridad: ahora todos validan JWT + `tenantId` |
| Modelos sin relaciones inversas | Prisma: requiere relaciones para validar schema |

### 🔄 Modificado

| Archivo | Cambios | Por Qué |
|---|---|---|
| `server.js` | + `roleGuard`, + mount `/api/users` | Agregar RBAC y gestión de usuarios |
| `seed.js` | Popula `studentId`, `department`, `barcode` | Multi-tenant requirements |
| `prisma/schema.prisma` | Relaciones, unique constraints por tenant | Multi-tenant strict + features |

---

## 🏗️ Arquitectura Modular

```
backend/src/
├── config/prismaClient.js          # Singleton Prisma
├── middlewares/
│   ├── authGuard.js                # JWT → req.user, req.tenantId
│   ├── saasGuard.js                # Bloquea SUSPENDED (403)
│   └── roleGuard.js                # RBAC factory middleware
├── validators/
│   ├── authValidators.js
│   ├── bookValidators.js
│   ├── loanValidators.js
│   ├── syncValidators.js
│   └── userValidators.js           # NEW: Zod schemas CRUD usuarios
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── loanController.js
│   ├── syncController.js
│   └── userController.js           # NEW: getUsers, createUser, updateUser, deleteUser
└── routes/
    ├── authRoutes.js
    ├── bookRoutes.js
    ├── loanRoutes.js
    ├── syncRoutes.js
    └── userRoutes.js               # NEW: RBAC-protected endpoints
```

---

## 🔐 Capas de Seguridad

### 1. Autenticación (authGuard)
- Lee cookie HttpOnly `token` (JWT).
- Verifica firma con `JWT_SECRET`.
- Popula `req.user = { id, role, tenantId, email }` y `req.userDb`.

### 2. SaaS Guard (saasGuard)
- Si `tenant.status = SUSPENDED` → 403.

### 3. RBAC (roleGuard)
- `roleGuard(['librarian', 'admin_plantel', 'superadmin'])` valida rol.
- **Roles**: `student`, `librarian`, `admin_plantel`, `superadmin`.

### 4. Input Validation (Zod)
- Todos los endpoints validan antes de procesar.
- Retorna 400 con detalles si validation falla.

### 5. Multi-Tenant Isolation
- Todas las queries filtran por `tenantId` del token.
- Unique constraints: `@@unique([tenantId, email])`, `@@unique([tenantId, studentId])`.

---

## 📡 Endpoints Principales

### Auth
- `POST /api/auth/login` — Login (email/CCT + password) → cookie HttpOnly `token`.
- `POST /api/auth/logout` — Limpia cookie.

### Books
- `GET /api/books` — Libros del tenant (exluye DELETED_LOGICAL).
- `POST /api/books` — Crear libro (auth required).

### Loans
- `POST /api/loans` — Crear préstamo (transactional).
- `POST /api/loans/:id/return` — Devolver libro (calcula multa si es tarde).

### Users (RBAC-Protected)
- `GET /api/users` — Lista usuarios (requiere librarian+).
- `POST /api/users` — Crear usuario (valida uniqueness por tenant).
- `PUT /api/users/:id` — Actualizar usuario.
- `DELETE /api/users/:id` — Eliminación lógica (`isDeleted = true`).

### Sync
- `POST /api/sync/loans` — Bulk sync offline (transactional).

---

## 🚀 Arrancar Localmente

### Con Docker Compose

```bash
cd <repo-root>
docker compose build --no-cache
docker compose up -d

# Esperar a que database esté healthy, luego:
docker compose exec backend npx prisma db push --skip-generate
docker compose exec backend npm run seed

# Verificar
curl http://localhost:3001/health
```

### Sin Docker

```bash
cd backend
npm install

# Configurar .env
echo 'DATABASE_URL=postgresql://user:pass@localhost:5432/biblioteka_dev' > .env
echo 'JWT_SECRET=dev-secret-key-12345' >> .env
echo 'CORS_ORIGIN=http://localhost:3000' >> .env

# Pushear schema
npx prisma db push

# Seed
npm run seed

# Dev server
npm run dev
```

---

## 📊 Flujos Principales

### Autenticación
```
POST /api/auth/login → Valida credentials → JWT + cookie HttpOnly → siguientes requests incluyen cookie automáticamente
```

### Crear Préstamo (Transactional)
```
POST /api/loans → valida tenant + usuario + libro → prisma.$transaction:
  ├─ Crea Loan record
  ├─ Actualiza Book.available = false, statusLogical = BORROWED
  └─ Si falla → rollback automático
```

### Devolver Préstamo (Con Multa)
```
POST /api/loans/:id/return → calcula días late → multa = días * 5.0 MXN → transacción:
  ├─ Actualiza Loan.status = RETURNED, fineAmount = multa
  ├─ Actualiza Book.available = true, statusLogical = ACTIVE
  └─ Si falla → rollback
```

### Gestión de Usuarios (RBAC)
```
POST /api/users → roleGuard(['librarian', 'admin_plantel', 'superadmin']) → valida schema → inyecta tenantId → valida uniqueness (email, studentId, barcode) por tenant → crea usuario
GET /api/users → mismo RBAC → lista usuarios no eliminados del tenant
```

---

## 🧪 Pruebas Postman

**Ver guía completa**: [POSTMAN_TEST_GUIDE.md](../POSTMAN_TEST_GUIDE.md) ⭐ **EMPIEZA AQUÍ**

Tiene 9 pasos detallados con:
- ✅ Credenciales correctas (Ana, Luis, María, Pedro)
- ✅ Payload exacto para cada request
- ✅ Status codes esperados (200, 201, 400, 403)
- ✅ Explicación de qué prueba cada paso
- ✅ Troubleshooting si algo falla
- ✅ Checklist final (10 items)

### Resumen Rápido
1. **Login Ana**: `POST /api/auth/login` → `ana@activa.edu.mx` / `Password123!` (200 ✅)
2. **Get Books**: `GET /api/books` (200 ✅ → 5 libros)
3. **Create User**: `POST /api/users` (201 ✅)
4. **List Users**: `GET /api/users` (200 ✅)
5. **Create Loan**: `POST /api/loans` (201 ✅)
6. **Return Loan**: `POST /api/loans/:id/return` (200 ✅ + multa si es tarde)
7. **RBAC Test**: `POST /api/users` como `luis` (student) → 403 ❌
8. **Validation Test**: email inválido → 400 ❌
9. **Suspended Tenant Test**: login como `maria` → 403 ❌

---

## 📝 Notas de Producción

- `JWT_SECRET`: genera con `openssl rand -hex 32`, rota periódicamente.
- Usa `prisma migrate deploy` (no `db push`) con scripts versionados.
- Implementa logging centralizado (Winston, Bunyan).
- Monitorea intentos fallidos de login y RBAC.

---

## ❓ FAQ

**¿Cómo agrego un nuevo rol?**
- Actualiza `userValidators.js` + `roleGuard` + repositorio.

**¿Cómo cambio la multa diaria?**
- Abre `src/controllers/loanController.js`, busca `const finePerDay = 5.0;`, cambia valor.

**¿Cómo manejo tenants suspendidos?**
- Middleware `saasGuard` bloquea automáticamente (403).

---

**Última actualización**: Junio 6, 2026 | **Versión**: 0.2.0 (RBAC + User Management)
