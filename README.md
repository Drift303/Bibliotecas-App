# 📚 Biblioteca Inteligente SaaS MVP

## 🎯 Fase Actual: v0.2.0 — RBAC + User Management + Multi-Tenant Strict

**Estado**: Backend estructurado con Clean Architecture, RBAC implementado, gestión completa de usuarios, modelo Prisma multi-tenant. Frontend en construcción.

---

## ✨ Cambios v0.2.0 (Junio 6, 2026)

### Agregado
- ✅ **RBAC (Role-Based Access Control)**: middleware `roleGuard` para proteger endpoints por rol (student, librarian, admin_plantel, superadmin).
- ✅ **User Management**: CRUD completo de usuarios con validación Zod, aislamiento por tenant, eliminación lógica.
- ✅ **Schema Multi-Tenant Strict**: relaciones inversas en Prisma, unique constraints por tenant (email, studentId, barcode), nuevos campos en Book/Loan.
- ✅ **Transacciones Atómicas**: `prisma.$transaction` en create/return loan y sync bulk.
- ✅ **Postman Collection**: endpoints para Books, Loans, Auth, Users con validaciones y flujos RBAC.

### Por Qué
- **RBAC**: Seguridad: solo librarians/admins pueden gestionar usuarios; students solo leen libros y sus préstamos.
- **User Management**: Requisito funcional: librarians crean/actualizar alumnos; admins crean librarians.
- **Multi-Tenant Strict**: Garantía: datos de un tenant NUNCA accesibles por otro; constraints en BD.
- **Transacciones**: Integridad: si sync falla parcialmente, rollback automático; no hay libros en estado inconsistente.

### Modificado
- `server.js`: montadas rutas `/api/users`, middlewares RBAC, stack de seguridad.
- `prisma/schema.prisma`: relaciones Tenant→(users, books, loans), nuevos campos, constraints.
- `seed.js`: popula `studentId`, `department`, `barcode` en usuarios; 2 tenants, 4 usuarios, 5 libros.
- `postman_collection.json`: nueva carpeta "Users" con 5 requests (list, create valid/invalid, duplicate, RBAC test).

---

## 📋 Descripción General

**Biblioteca Inteligente** es una plataforma SaaS multi-tenant diseñada para modernizar la gestión de bibliotecas escolares.

### Características

| Característica | Estado | Descripción |
|---|---|---|
| **Multi-tenant** | ✅ Done | Aislamiento estricto por dominio de correo (@escuela.edu.mx) o CCT |
| **RBAC** | ✅ Done | Roles (student, librarian, admin_plantel, superadmin) con permisos granulares |
| **JWT + HttpOnly Cookies** | ✅ Done | Autenticación segura, cookies imposibles de acceder vía JS |
| **Gestión de Usuarios** | ✅ Done | CRUD con validación, duplicate detection, eliminación lógica |
| **Libros** | ✅ Done | Crear, listar (filtrado por tenant), física (good/damaged/lost) + lógica (active/borrowed/deleted) |
| **Préstamos** | ✅ Done | Crear, devolver con cálculo de multas (días tarde × 5 MXN), transacciones atómicas |
| **Sync Offline** | ✅ Done | POST `/api/sync/loans` para procesar lote de transacciones offline en BD (transactional) |
| **Transacciones BD** | ✅ Done | Todas operaciones críticas usan `prisma.$transaction` |
| **Offline-First Frontend** | 🚧 WIP | Vite + React, IndexedDB para Service Worker, fallback SQLite |
| **Barcode Scanner** | 📋 TODO | Integración con cámara para ISBN/EAN13 |
| **Excel Import** | 📋 TODO | Carga masiva de catálogos |

---

## 🏗️ Estructura del Proyecto

```
Bibliotecas-App/
├── backend/                           # Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── config/                   # Configuración (Prisma singleton)
│   │   ├── middlewares/              # Auth, SaaS Guard, RBAC
│   │   ├── validators/               # Zod schemas
│   │   ├── controllers/              # Lógica de negocio
│   │   └── routes/                   # Endpoints
│   ├── prisma/
│   │   ├── schema.prisma             # Multi-tenant models
│   │   └── seed.js                   # Seed data (tenants, users, books)
│   ├── server.js                      # Express app
│   ├── package.json
│   ├── README.md                      # Docs backend
│   └── postman_collection.json       # Postman v2.1.0
├── frontend/                          # Vite + React + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── index.html
├── docker/                            # Dockerfiles optimizados
│   ├── Dockerfile.backend             # Node 18 Alpine + npm ci + Prisma generate
│   ├── Dockerfile.frontend            # Node 18 Alpine + Vite build
│   ├── Dockerfile.postgres            # PostgreSQL 15 Alpine
│   ├── init-db.sql                   # SQL init scripts
│   └── seed-db.sql                   # SQL seed (opcional)
├── docker-compose.yml                 # Orquestación: backend, frontend, db, redis
├── README.md                          # Este archivo
└── docs/
    ├── IMPLEMENTATION_PLAN.md         # Plan técnico
    └── ...
```

---

## 🔐 Seguridad Multi-Capa

### Layer 1: Autenticación (authGuard Middleware)
```javascript
POST /api/auth/login
├─ Valida identifier (email@escuela.edu.mx o CCT) + password
├─ Compara password con bcrypt
├─ Genera JWT: { id, role, tenantId, email }
├─ Configura cookie HttpOnly, Secure, SameSite=Strict
└─ Siguientes requests incluyen cookie automáticamente
```

### Layer 2: SaaS Guard (saasGuard Middleware)
```javascript
Si tenant.status === SUSPENDED → 403 Forbidden
```

### Layer 3: RBAC (roleGuard Middleware)
```javascript
roleGuard(['librarian', 'admin_plantel', 'superadmin'])
├─ Verifica req.user.role está en lista permitida
└─ Si no → 403 Forbidden
```

### Layer 4: Multi-Tenant Isolation
- **Inyección de tenantId**: todas las queries filtran por `req.tenantId` del token.
- **Unique Constraints por Tenant**: `@@unique([tenantId, email])`, `@@unique([tenantId, studentId])`, `@@unique([tenantId, barcode])`.
- **Imposible acceder datos de otro tenant** (BD + app logic).

### Layer 5: Input Validation (Zod)
- Todos los endpoints validan schemas antes de procesar.
- Retorna 400 con detalles de error si validation falla.

### Layer 6: Transactional Integrity (Prisma Transactions)
```javascript
prisma.$transaction([...]) // Todo o nada
├─ Si alguna inserción falla → rollback automático
└─ No hay estado parcial/inconsistente en BD
```

---

## 📡 Endpoints Principales (Protegidos)

### Auth (Sin RBAC)
- `POST /api/auth/login` — Login (identifier + password) → cookie HttpOnly.
- `POST /api/auth/logout` — Logout (limpia cookie).

### Books (Auth Required)
- `GET /api/books` — Listar libros del tenant (excluye DELETED_LOGICAL).
- `POST /api/books` — Crear libro (requiere auth).

### Loans (Auth Required)
- `POST /api/loans` — Crear préstamo (transactional).
- `POST /api/loans/:id/return` — Devolver libro (calcula multa si es tarde, transactional).

### Users (RBAC: librarian, admin_plantel, superadmin)
- `GET /api/users` — Lista usuarios del tenant.
- `POST /api/users` — Crear usuario (valida uniqueness por tenant).
- `PUT /api/users/:id` — Actualizar usuario.
- `DELETE /api/users/:id` — Eliminación lógica (`isDeleted = true`).

### Sync (Auth Required)
- `POST /api/sync/loans` — Procesa lote offline en transacción atómica.

---

## 🚀 Arrancar con Docker Compose

### Paso 1: Build
```bash
cd Bibliotecas-App
docker compose build --no-cache
```

### Paso 2: Levantar servicios
```bash
docker compose up -d
# Espera a que database esté healthy (~10s)
```

### Paso 3: Pushear schema Prisma a BD
```bash
docker compose exec backend npx prisma db push --skip-generate
```

### Paso 4: Seed (crea 2 tenants, 4 usuarios, 5 libros)
```bash
docker compose exec backend npm run seed
```

### Paso 5: Verificar
```bash
# Health check
curl http://localhost:3001/health

# Test DB
curl http://localhost:3001/test-db
```

### Paso 6: Frontend
```
Frontend: http://localhost:3000
Backend API: http://localhost:3001/api
```

### Parar servicios
```bash
docker compose down
# O si quieres limpiar volúmenes:
docker compose down -v
```

---

## 🧪 Testing con Postman

**Ver la guía completa**: [POSTMAN_TEST_GUIDE.md](POSTMAN_TEST_GUIDE.md) con 9 pasos detallados, credenciales correctas, payloads exactos y troubleshooting.

### Credenciales de Seed (v0.2.0)

| Email | CCT | Password | Rol | Tenant | Propósito |
|---|---|---|---|---|---|
| `ana@activa.edu.mx` | `CCT-ACT-001` | `Password123!` | librarian | activa | **Principal - uso en pruebas** |
| `luis@activa.edu.mx` | `CCT-ACT-STU-01` | `Alumno123!` | student | activa | RBAC test (genera 403) |
| `maria@suspendida.edu.mx` | - | `Password123!` | librarian | suspendida | SaaS Guard test (genera 403) |
| `pedro@suspendida.edu.mx` | - | `Alumno123!` | student | suspendida | - |

### Resumen Rápido
1. Importa `backend/postman_collection.json` en Postman.
2. **Activa cookie jar** (Settings → Cookies).
3. **Login Ana** (librarian): `ana@activa.edu.mx` / `Password123!`
   - Resultado: cookie `token` capturada automáticamente.
4. **Get Books**: `GET /api/books` (usa cookie).
   - Resultado: 5 libros de tenant `activa.edu.mx`.
5. **Create User**: `POST /api/users` (requiere librarian role).
   - Payload: nombre, email, role, studentId, department, barcode.
   - Resultado: usuario creado (201) o 400 si duplicado.
6. **RBAC Test**: Intenta crear usuario como student (`luis@activa.edu.mx` / `Alumno123!`).
   - Resultado: 403 Forbidden.
7. **Suspended Tenant Test**: Intenta login como `maria@suspendida.edu.mx` / `Password123!`.
   - Resultado: 403 Forbidden (tenant SUSPENDED).

---

## 📊 Flujos Principales

### 1. Autenticación
```
POST /api/auth/login → validar → JWT en cookie → incluida automáticamente en requests
```

### 2. Crear Préstamo (Transactional)
```
POST /api/loans 
  ├─ authGuard: valida cookie JWT
  ├─ saasGuard: valida tenant no suspendido
  ├─ Validación Zod: userId, bookId, dueDate
  ├─ prisma.$transaction:
  │   ├─ Crea Loan record
  │   ├─ Actualiza Book.available = false
  │   └─ Si falla → rollback
  └─ Retorna Loan (200)
```

### 3. Devolver Préstamo (Con Multa)
```
POST /api/loans/:id/return
  ├─ Calcula días late: (ahora - dueDate) / (1000*60*60*24)
  ├─ Multa: max(0, días_late) * 5.0 MXN
  ├─ prisma.$transaction:
  │   ├─ Actualiza Loan.status = RETURNED, fineAmount = multa
  │   ├─ Actualiza Book.available = true
  │   └─ Si falla → rollback
  └─ Retorna Loan con multa (200)
```

### 4. Sync Offline (Service Worker)
```
POST /api/sync/loans
  ├─ Payload: { tenantId, transactions: [...] }
  ├─ Validación: JWT + tenantId match
  ├─ prisma.$transaction (todos):
  │   ├─ Para cada transacción:
  │   │   ├─ Crea Loan
  │   │   ├─ Actualiza Book si status = BORROWED
  │   │   └─ Si falla → rollback total
  │   └─ Retorna array de Loans creados
  └─ Frontend: procesa respuesta, limpia IndexedDB
```

### 5. Gestión de Usuarios (RBAC)
```
POST /api/users (librarian+)
  ├─ roleGuard: valida req.user.role en ['librarian', 'admin_plantel', 'superadmin']
  ├─ Validación Zod: name, email, role, studentId, department, barcode
  ├─ Inyecta tenantId del token
  ├─ Valida uniqueness (email, studentId, barcode) por tenant
  ├─ Si password: hash con bcryptjs
  ├─ Crea usuario
  └─ Retorna user (200) o 400 si duplicado
```

---

## 🛠️ Stack Técnico

### Backend
- **Runtime**: Node.js 18 (Alpine)
- **Framework**: Express.js
- **ORM**: Prisma (Postgres)
- **Validación**: Zod
- **Auth**: JWT + bcryptjs
- **Middleware**: helmet, express-rate-limit, cookie-parser, cors
- **Dev**: nodemon (hot-reload)

### Frontend
- **Build**: Vite
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (offline) + Dexie.js
- **HTTP**: Axios
- **Export**: jsPDF (reportes)

### Database
- **Primary**: PostgreSQL 15 (Alpine)
- **Cache**: Redis 7 (Alpine, opcional)
- **Fallback**: SQLite (si `ENABLE_SQLITE_FALLBACK=true`)

### Infraestructura
- **Contenedores**: Docker Compose
- **Orquestación**: Postgres, Redis, Backend (hot-reload), Frontend (Vite dev server)
- **Redes**: Bridge network (subnet 172.25.0.0/16)

---

## 📈 Roadmap Futuro

### v0.3.0 (Julio)
- [ ] Frontend: Login UI, Dashboard, Book listing
- [ ] Barcode scanner integration
- [ ] Service Worker + IndexedDB

### v0.4.0 (Agosto)
- [ ] Excel import para catálogos masivos
- [ ] Reports (PDF) de préstamos
- [ ] Notificaciones de libros atrasados

### v1.0.0 (Septiembre)
- [ ] Pruebas UAT con una escuela piloto
- [ ] Optimizaciones de performance
- [ ] Deployment a producción (Azure/AWS)

---

## 🤝 Equipo

- **Backend/RBAC**: Implementación completa (auth, users, CRUD, transacciones)
- **Frontend**: En construcción (Vite + React)
- **DevOps**: Docker Compose, CI/CD (TODO)

---

## 📚 Documentación

- [Backend README](backend/README.md) — API, endpoints, RBAC, flujos, FAQ
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Plan técnico, tareas
- [Postman Collection](backend/postman_collection.json) — Requests de prueba

---

## ⚡ Quick Start (Sin Docker)

```bash
# Backend
cd backend
npm install
# Configurar .env con DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npx prisma db push
npm run seed
npm run dev        # http://localhost:3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev        # http://localhost:3000
```

---

**Última actualización**: Junio 6, 2026 | **Versión**: 0.2.0 (RBAC + User Management)

```bash
# Encontrar proceso usando el puerto
lsof -i :3000              # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Matar proceso
kill -9 <PID>              # macOS/Linux
taskkill /PID <PID> /F    # Windows

# O cambiar puerto en docker-compose.yml
# Línea del frontend: "3000:3000" → "3001:3000"
```

### ❌ Error: PostgreSQL no inicia / "ConnectionRefused"

```bash
# Verificar salud del contenedor
docker compose ps

# Ver logs de BD
docker compose logs database

# Reiniciar base de datos
docker compose restart database

# Opción nuclear: Eliminar volumen y recrear
docker compose down -v
docker compose up --build database -d
sleep 30
```

### ❌ Error: "Cannot find module 'nodemon' / 'prisma'"

```bash
# Reconstruir la imagen
docker compose build --no-cache backend

# O reinstalar dependencias
docker compose exec backend rm -rf node_modules package-lock.json
docker compose exec backend npm install
```

### ❌ Cambios de código no se reflejan (Hot-reload no funciona)

```bash
# Verificar volúmenes están correctamente montados
docker inspect <container_id> | grep -A 5 Mounts

# Reiniciar contenedor específico
docker compose restart backend

# Si persiste: verificar permisos de archivos
chmod -R 755 ./backend ./frontend
```

### ❌ Error de Sincronización Offline

```bash
# Limpiar cola de sincronización
docker compose exec backend npx prisma db execute --stdin < clear-sync-queue.sql

# Ver estado de sincronización en logs
docker compose logs backend | grep -i "sync\|offline"
```

### 🔍 Conectar a PostgreSQL desde cliente externo

```bash
# Instalar cliente psql (si no lo tienes)
# Linux: sudo apt install postgresql-client
# macOS: brew install postgresql

# Conectar a BD
psql postgresql://biblioteka_user:biblioteka_pass@localhost:5432/biblioteka_dev

# Ejecutar queries
\dt                         # Listar tablas
\d <nombre_tabla>          # Ver estructura de tabla
SELECT * FROM tenants;     # Consulta de ejemplo
```

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET / CLOUD                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
         (Cloud CDN/DNS)    (Proxy Reverso)    (Load Balancer)
                    │             │             │
         ┌──────────┴─────────────┴─────────────┴──────────┐
         │                                                  │
    ┌────▼──────┐  Docker Compose (Localhost)  ┌──────────▼───┐
    │ Frontend   │◄─────────────────────────────► Backend API  │
    │ Next.js    │      HTTP/WebSocket           Express       │
    │ PWA        │                                Fastify      │
    │ Tailwind   │                                             │
    └────┬──────┘                                 ┌────────────┤
         │                                        │            │
         │ ┌────────────────────────────────────┤            │
         │ │                                    │            │
         ▼ ▼                                    ▼ ▼          ▼
    ┌──────────────────┐               ┌──────────────────┐
    │  INDEXEDDB       │               │  REDIS CACHE     │
    │  (Offline Store) │               │  (Sessions)      │
    │  Dexie.js        │               │  (Caché)         │
    └────────┬─────────┘               └────────┬─────────┘
             │                                  │
             └──────────────────┬───────────────┘
                                │
                         ┌──────▼──────┐
                         │ PostgreSQL   │
                         │ (Primary DB) │
                         └──────┬───────┘
                                │
                         ┌──────▼──────┐
                         │   SQLite    │
                         │  (Fallback) │
                         └─────────────┘

MODO CLOUD (Producción):
Frontend → Backend → PostgreSQL (RDS) ← Replicado a SQLite local

MODO LOCALHOST (Desarrollo):
Todos los contenedores ejecutándose localmente con hot-reload
```

### Flujo de Autenticación Multi-tenant

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN REQUEST (email + password)                          │
│    → POST /api/auth/login                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TENANT RESOLUTION (por email domain)                      │
│    → Buscar tenant_id de @jmmorelos.edu.mx                  │
│    → Validar suscripción (SaaS Guard)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTENTICA USUARIO                                         │
│    → Buscar usuario en tenant                               │
│    → Verificar contraseña bcrypt                            │
│    → Validar estado (is_active, email_verified)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERAR JWT + SET COOKIES                                 │
│    → JWT: { user_id, tenant_id, role } + HS256              │
│    → Cookie HttpOnly: jwt_token (secure, sameSite=Lax)      │
│    → Response: { accessToken, user, permissions }           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. MIDDLEWARE: TENANT ISOLATION                             │
│    → Cada request verifica tenant_id en JWT                 │
│    → Clause WHERE tenant_id = :tenantId en TODAS las BD     │
│    → Rechazar si tenant_id no coincide                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad & Mejores Prácticas

### Checklist de Seguridad

- [ ] Cambiar todos los `JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_PASSWORD` en producción
- [ ] Usar HTTPS en producción (certificados SSL/TLS)
- [ ] Habilitar 2FA para administradores
- [ ] Configurar CORS correctamente (no usar `*`)
- [ ] Implementar rate limiting en endpoints de login
- [ ] Activar HSTS headers (HTTP Strict-Transport-Security)
- [ ] Ejecutar auditoría de dependencias: `npm audit`
- [ ] Configurar backups automáticos de PostgreSQL
- [ ] Usar variables de entorno para todos los secretos (nunca en código)
- [ ] Revisar logs de auditoría regularmente

### Variables de Entorno Sensibles

**Nunca commitear:**
```
JWT_SECRET
COOKIE_SECRET
DATABASE_PASSWORD
SMTP_PASSWORD
API_KEYS (terceros)
```

**Siempre usar `.env.local`** o gestor de secretos (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 🚢 Despliegue en Producción

### Opción 1: Azure Container Instances (ACI)

```bash
# Login a Azure
az login

# Crear resource group
az group create --name BibliotecaRG --location eastus

# Desplegar con docker compose
az container create --resource-group BibliotecaRG \
  --name biblioteca-app \
  --image myregistry.azurecr.io/biblioteca-app:latest
```

### Opción 2: Railway / Render / Vercel

```bash
# Railway (recomendado para este proyecto)
npm install -g @railway/cli
railway init
railway up
```

### Opción 3: Docker Hub + Docker Compose Manual

```bash
# Build y push a Docker Hub
docker build -f docker/Dockerfile.backend -t tu-usuario/biblioteca-backend:1.0 ./backend
docker push tu-usuario/biblioteca-backend:1.0

# En servidor remoto:
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoreo & Logging

### Healthchecks

Todos los contenedores tienen healthchecks configurados:

```bash
# Ver estado de salud
docker compose ps

# Logs de healthcheck
docker compose logs --follow --tail 20
```

### Acceso a Logs Centralizados

```bash
# Logs de todos los servicios
docker compose logs --follow

# Solo backend
docker compose logs --follow backend

# Últimas 100 líneas
docker compose logs --tail 100
```

---

## 🤝 Contribuyendo

### Flujo de Git

1. **Crear rama feature**: `git checkout -b feature/mi-feature`
2. **Hacer commits pequeños**: `git commit -m "type(scope): descripción"`
3. **Push**: `git push origin feature/mi-feature`
4. **Crear Pull Request** en GitHub

### Tipos de Commits

```
feat:    Nueva funcionalidad
fix:     Corrección de bug
docs:    Cambios en documentación
style:   Cambios de formato (no lógica)
refactor: Refactorización de código
perf:    Mejoras de rendimiento
test:    Agregar/actualizar tests
chore:   Cambios en deps, config, etc.
```

### Ejemplo

```bash
git commit -m "feat(barcode): agregar lector QR en frontend"
git commit -m "fix(auth): resolver issue de JWT expiration"
```

---

## 📞 Soporte & Contacto

- **Email**: dev-team@biblioteca-inteligente.com
- **Issues**: [GitHub Issues](https://github.com/tu-organizacion/biblioteca-inteligente/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/tu-organizacion/biblioteca-inteligente/wiki)

---

## 📜 Licencia

Este proyecto está bajo licencia **MIT**. Ver [LICENSE](LICENSE) para detalles.

---

**Última actualización:**  02 Junio 2024  
**Versión del Documento:** 1.0  
**Autor:** Software Architecture Team

