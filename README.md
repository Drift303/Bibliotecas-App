# 📚 Biblioteca Inteligente SaaS MVP

## Descripción General

**Biblioteca Inteligente** es una plataforma SaaS multi-tenant, híbrida y de alta disponibilidad diseñada para modernizar la gestión de bibliotecas escolares. Ofrece dos modos de operación:

- **☁️ Cloud Mode (SaaS)**: Despliegue en nube con PostgreSQL, ideal para instituciones con conectividad constante.
- **🏠 Localhost Mode (Hybrid)**: Despliegue local con Docker Compose y fallback a SQLite, perfecto para entornos educativos con conectividad limitada.

### Características Principales

| Característica | Descripción |
|---|---|
| **Multi-tenant** | Identificación por dominio de correo institucional (ej: `@jmmorelos.edu.mx`) o código CCT |
| **Offline-First Selectivo** | Alumnos en tiempo real; Bibliotecarios con IndexedDB/Dexie.js sin conexión |
| **Lector de Códigos de Barras** | Integración con cámara para escaneo y lectura automática de ISBN/EAN13 |
| **PWA Completa** | Funcionamiento offline, instalable en móviles y desktops |
| **Importación Masiva** | Carga de catálogos desde Excel mediante parseador NodeJS |
| **Seguridad Multi-capa** | JWT + HttpOnly Cookies, SaaS Guard middleware, aislamiento por tenant_id |
| **Sincronización Inteligente** | Cola de sincronización con reintentos automáticos para operaciones offline |

---

## 🚀 Inicio Rápido

### Requisitos Previos

Instala las herramientas necesarias antes de comenzar:

```bash
# Verificar versiones mínimas recomendadas
docker --version      # v24.0+
docker compose --version  # v2.20+
node --version        # v18+
npm --version         # v10+
```

**Descargas:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js LTS](https://nodejs.org/)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-organizacion/biblioteca-inteligente.git
cd biblioteca-inteligente
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con valores específicos de tu entorno
# (Base de datos, JWT_SECRET, etc.)
nano .env.local
```

**Variables críticas a cambiar en producción:**
```
JWT_SECRET=your-super-secret-key-here
DATABASE_PASSWORD=your-secure-password
COOKIE_SECRET=another-secret-key
```

### Paso 3: Levantar los Contenedores

```bash
# Construir e iniciar en modo background
docker compose up --build -d


# Detener y eliminar volúmenes (⚠️ BORRA DATOS)
├── 📄 .env.example                   # Plantilla de variables de entorno
│   │   │   ├── layout.js
│   │   ├── SearchAutoComplete.js
│   │       ├── LoginForm.js
│   ├── 📄 nodemon.json               # Configuración hot-reload
│   │   ├── 🔐 middleware/
# Biblioteca Inteligente — Fase Inicial (Conexión Backend ↔ DB ↔ Frontend)

Este repositorio contiene un conjunto inicial de archivos para probar y validar la arquitectura básica del MVP:

- Backend: Express + Prisma (PostgreSQL)
- Frontend: Vite + React + Tailwind (diagnóstico de conexión)
- Scripts de inicialización y seeding para pruebas locales

Archivos clave creados en esta fase:

- `/.gitignore` — reglas para Node, Prisma, .env y artefactos locales
- `/backend/package.json` — dependencias y scripts del backend
- `/backend/prisma/schema.prisma` — modelo `Tenant` (id, name, emailDomain, status)
- `/backend/prisma/seed.js` — script de seed para crear 2 tenants (activo y suspendido)
- `/backend/server.js` — Express con endpoints `/api/health` y `/api/test-db`
- `/frontend/package.json` — Vite + React + Tailwind + jsPDF + axios
- `/frontend/index.html`, `/frontend/src/*` — aplicación React mínima para diagnóstico

Qué se valida con este entregable:

- El backend responde en `/api/health`.
- El backend puede leer Tenants desde PostgreSQL y exponerlos en `/api/test-db`.
- El frontend puede consumir ambos endpoints y mostrar un estado visual.

Librerías instaladas y por qué:

- Backend:
     - `express`: servidor HTTP minimal y flexible.
     - `@prisma/client` y `prisma`: ORM tipo-safe para modelado y migraciones.
     - `dotenv`: cargar variables de entorno en contenedores/desarrollo.
     - `cors`: habilitar peticiones desde el frontend local.

- Frontend:
     - `vite`: dev server ultrarrápido para React.
     - `react`, `react-dom`: framework UI.
     - `tailwindcss`, `postcss`, `autoprefixer`: utilidades CSS para Angel (maquetado rápido y responsive).
     - `axios`: cliente HTTP sencillo para llamadas al backend.
     - `jspdf`: utilitario para generación de PDFs (Vanesa lo usará más adelante).

Comandos exactos para levantar y probar localmente

1) Construir y levantar con Docker Compose (si usas la configuración `docker-compose.yml` en la raíz):

```powershell
# Desde la raíz del proyecto
docker compose up --build -d

# Ver logs (opcional)
# Tests del frontend
```

2) Migraciones de Prisma y seed (ejecutar dentro del contenedor `backend`):

```powershell
# Ejecutar migraciones (crea tablas)
docker compose exec frontend npm run test

# Ejecutar seed para insertar 2 tenants
docker compose exec backend node prisma/seed.js
```

3) Probar endpoints desde tu host (o usar el frontend):

```powershell
# Health
curl http://localhost:3001/api/health

# Traer tenants
curl http://localhost:3001/api/test-db
```

4) Alternativa: ejecutar localmente sin Docker (desarrollo rápido)

```powershell
# Backend

cd <repo>/backend
npm install
# Configurar .env con DATABASE_URL apuntando a tu PostgreSQL local
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev

# Frontend (en otra terminal)
cd <repo>/frontend
npm install
npm run dev
```

Rutas y archivos para el equipo

- Backend: [backend/server.js](backend/server.js) — endpoints básicos de prueba
- Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Seed: [backend/prisma/seed.js](backend/prisma/seed.js)
- Frontend: [frontend/src/App.jsx](frontend/src/App.jsx) — interfaz de diagnóstico

Notas finales

- Esta fase inicial es deliberadamente mínima: sirve para validar conectividad y flujo de datos end-to-end.
- Siguientes pasos recomendados: implementar autenticación, agregar tests automáticos, e integrar el esquema completo de `Tenant` en la lógica de negocio (middleware de tenancy).

Si quieres, puedo ahora:

- Ejecutar (en tu entorno) los comandos de migración y seed (si me autorizas a correr `docker compose up --build`), o
- Añadir los scripts de Dockerfile para backend/frontend adaptados a esta configuración mínima Vite/Express.

# Build para producción
docker compose exec frontend npm run build

# Análisis de bundle
docker compose exec frontend npm run analyze
```

---

## 🛠️ Solución de Problemas

### ❌ Error: "Puerto 3000 ya está en uso"

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

