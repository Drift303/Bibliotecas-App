# Plan de Implementación Detallado por Roles - MVP

> Archivo: docs/IMPLEMENTATION_PLAN.md
> Propósito: Asignación técnica, tareas por rol y metas de módulos para entregar un MVP funcional.

---

## Resumen Ejecutivo

Este plan divide el trabajo del MVP en dos áreas principales: Diseño/Frontend y Servidor/Datos/Pruebas. Cada rol tiene tareas técnicas claras, criterios de aceptación y dependencias. El objetivo es entregar un MVP multi-tenant, híbrido (cloud/local), con sincronización offline selectiva.

---

## Convenciones Generales

- Repositorio: Monorepo con carpetas `frontend/`, `backend/`, `docker/` y `docs/`.
- Flujos Git: GitFlow para ramas de release y hotfix, GitHub Flow para features diarias.
- Entorno de desarrollo: `docker compose up --build`
- Tests: Jest (backend), Vitest/React Testing Library (frontend)
- Linter/Formatter: ESLint + Prettier (configuración compartida)

---

## AREA DE DISEÑO Y FRONTEND

Objetivo general: Entregar interfaces responsivas, accesibles y PWA listas para interacción y sincronización offline parcial.

### Angel — Maquetado & Estructura Web/PWA

Responsabilidades técnicas:
- Crear la estructura base del frontend usando Next.js (App Router o Pages según preferencia).
- Implementar Tailwind CSS y configuración de diseño responsive.
- Crear layouts globales reutilizables: `MainLayout`, `AdminLayout`, `LibrarianLayout`, `StudentLayout`.
- Maquetar pantallas estáticas:
  - Página de catálogo y búsqueda (lista y ficha de libro).
  - Vista de alumno (sin capacidad offline): historial de préstamos, perfil.
  - Tabla maestra de inventario (DataGrid con paginación y filtros).
  - Formularios de préstamo: seleccionar usuario, seleccionar ejemplar, confirmar préstamo.
  - Vistas de SuperAdmin: gestión de tenants, métricas básicas.
- Configurar PWA (manifest.json, service worker) para modo offline y añadir iconos.
- Asegurar que los componentes principales estén listos para integrar datos (props y hooks placeholders).

Criterios de aceptación del módulo:
- Todas las pantallas responsive y con layout probado en 320px–1440px.
- Tailwind configurado y funcionando con JIT.
- PWA instalable y mostrando pantalla de offline básico.
- Componentes documentados en `frontend/README.md`.

Estimación: 2 sprints (2 desarrolladores: Angel + Vanesa colaborando en detalles visuales)


### Vanesa — Diseño UI/UX, Seguridad Frontend & Interactividad

Responsabilidades técnicas:
- Diseñar guía de estilos: paleta azul/gris acero, tipografías, espaciados y tokens de diseño.
- Añadir accesibilidad (WCAG AA) en componentes clave: etiquetas ARIA, focus states.
- Integrar lector de códigos de barras por cámara utilizando `@zxing/library` o `html5-qrcode`.
- Implementar buscador con autocompletado (debounce, suggestions): `SearchAutoComplete`.
- Generar credenciales PDF con `jsPDF` y/o `pdf-lib` para descargar credenciales de usuario.
- Crear mapa de estanterías 2D interactivo: SVG dinámico con grid, zoom y selección.
- Implementar saneamiento de formularios (validator.js o Zod) y manejar cookies seguras (HttpOnly via backend).
- Diseñar flujos de interacción para modo offline: indicar estado, colas de sincronización y conflictos.

Criterios de aceptación del módulo:
- Guía de estilos disponible en `frontend/styles/tokens.json`.
- Lector de códigos funciona en dispositivos móviles y desktop con cámara.
- Autocomplete con mock API y pruebas de usabilidad.
- Generación de PDF testeada y descargable en los navegadores objetivo.
- Mapas interactivos con eventos y prueba de rendimiento para 200 estanterías.

Estimación: 3 sprints (incluye pruebas de usabilidad y correcciones)


---

## AREA DE SERVIDOR, DATOS Y PRUEBAS

Objetivo general: Proveer una API segura, aislada por tenant, tolerante a fallos, con lógica de negocio para sincronización offline.

### German — Backend Lead & Git Administrator

Responsabilidades técnicas:
- Definir el flujo de trabajo Git (GitHub): ramas `main`, `develop`, `release/*`, `hotfix/*`, `feature/*`.
- Implementar autenticación híbrida:
  - Login por correo institucional o ID de escuela (CCT)
  - JWT + Refresh Tokens
  - Cookies HttpOnly para sesiones web
- Implementar middleware `saasGuard`:
  - Verificar estado de suscripción
  - Bloquear acceso si suscripción suspendida
- Implementar `tenantResolver` y `tenantIsolation` middleware:
  - Resolver tenant por email domain o por `X-Tenant-ID` header
  - Añadir `tenant_id` a todas las queries y contexto de request
- Diseñar algoritmo único para generación de códigos de barra (EAN13 + prefijo por tenant)
- Implementar parseador de Excel (`xlsx`, `exceljs`) para importación masiva con chunking y job queue
- Implementar endpoints críticos:
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/books`
  - `POST /api/loans`
  - `POST /api/sync/offline`
  - `GET /api/health`
- CI: Configurar GitHub Actions para lint, test y build (CI pipeline).
- Release: Tagging semántico e integración con releases en GitHub.

Criterios de aceptación:
- Endpoints documentados en `docs/API.md` y cubiertos por tests de integración.
- `saasGuard` bloqueando correctamente a tenants suspendidos (cobertura de tests).
- Import masivo de Excel probado con datasets de 10k filas y reporte de errores por fila.

Estimación: 4 sprints (incluye CI, tests y documentación)


### Diana — Database Architect & QA Lead

Responsabilidades técnicas:
- Diseñar esquema relacional en Prisma ORM con aislamiento por `tenant_id`.
- Crear una réplica funcional en SQLite para modo local con estructuras idénticas (usar `DATABASE_URL` dinámico en runtime).
- Definir y documentar el protocolo de sincronización offline:
  - Estructura de la cola (`offline_sync_queue`)
  - Operaciones por lote, compensación y reintentos
  - Estrategia de resolución de conflictos (`server-wins`, `last-write-wins`, merge custom)
- Implementar scripts para migraciones reproducibles con Prisma.
- Escribir plan de pruebas (QA):
  - Unit tests para modelos y servicios críticos
  - Integration tests para endpoints y flujos de autenticación
  - Offline simulations: desconexión de red, encolamiento en IndexedDB, re-sincronización con conflictos
  - Load testing básico: JMeter o k6 simulando 100 concurrent users por tenant
- Definir backups y restore procedures para PostgreSQL y SQLite
- Crear procedimientos de verificación de integridad de datos post-sync

Criterios de aceptación:
- Esquema de Prisma documentado (`prisma/schema.prisma`) y pasa migraciones limpias.
- Pruebas de sincronización con 95% de éxito en escenarios de reintentos y 0 pérdida de datos en pruebas automatizadas.
- Plan QA aprobado y checklist ejecutable.

Estimación: 4 sprints (paralelo al desarrollo backend)


---

## Entregables por Módulo

A continuación se listan los módulos del MVP y qué se espera que entreguen al completar sus tareas.

### 1) Autenticación y Tenancy
- `backend/src/middleware/tenantResolver.js`
- `backend/src/middleware/saasGuard.js`
- `backend/src/controllers/authController.js`
- Tests de unidad e integración para login, refresh y logout
- Documentación en `docs/API.md`

Meta: Login híbrido robusto y aislamiento por tenant implementados.


### 2) Catálogo y Búsqueda
- `frontend/components/SearchAutoComplete.js`
- `backend/src/controllers/booksController.js`
- Endpoints: `GET /api/books`, `GET /api/books/:id`
- Indexes en PostgreSQL para búsqueda por título y autor

Meta: Búsqueda rápida y escalable con resultados paginados.


### 3) Gestión de Inventario y Préstamos
- `backend/src/services/barcodeService.js`
- `backend/src/controllers/loansController.js`
- `frontend/components/LoanForm.js`

Meta: Flujo de préstamo completo, generación de barcode único por ejemplar.


### 4) Offline Sync (Bibliotecarios)
- `frontend/lib/offline.js` (Dexie.js)
- `backend/src/services/offlineSyncService.js`
- Endpoint `POST /api/sync/offline` con batch processing

Meta: Colas offline robustas, conflictos resueltos y reconciliación comprobada.


### 5) Importación Masiva
- `backend/src/services/excelImportService.js`
- Job queue para procesamiento asíncrono (BullMQ o similar)

Meta: Importación fiable con reportes y reintentos.


### 6) PWA y Funcionalidades de Cámara
- `frontend/components/BarcodeReader.js`
- Service Worker + Workbox config

Meta: Lector de códigos por cámara y PWA instalable con experiencia offline mínima.


### 7) Observabilidad y Monitoreo
- Health endpoints `GET /api/health`
- Logs estructurados (JSON)
- Documentos de cómo acceder a logs y backups

Meta: Capacidad mínima para operaciones y diagnóstico.


---

## Dependencias y Orden de Trabajo

1. Infraestructura Docker (Dev) — Configurar `docker compose` y DB inicial
2. Backend core — Auth, Tenancy, DB models
3. Prisma schema + migraciones — Coordinar con Diana
4. Frontend shell + layouts — Angel
5. Offline sync proto — Vanesa + German + Diana
6. Import masivo — German
7. QA + tests — Diana
8. CI/CD — German

---

## Checklist de Lanzamiento del MVP

- [ ] Endpoints críticos implementados y documentados
- [ ] Autenticación y tenancy probados con 3 tenants
- [ ] PWA + lector de códigos funcionando en móvil
- [ ] Sincronización offline probada en 5 escenarios distintos
- [ ] Scripts de migración y seed funcionando
- [ ] Pipeline CI ejecutándose correctamente
- [ ] README y documentación básica completados

---

## Notas Finales

- Mantener la comunicación diaria con standups cortos (15 minutos)
- Priorizar features end-to-end mínimo viable antes de mejorar UX
- Documentar decisiones de diseño (trade-offs) en `docs/DECISIONS.md`

---

**Generado por:** Equipo de Arquitectura  
**Fecha:** Junio 01, 2026
