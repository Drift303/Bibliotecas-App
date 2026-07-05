# Biblioteca Inteligente — Documentación de API

**Base URL (producción):** `https://loyal-nature-production-26de.up.railway.app/api`  
**Base URL (local):** `http://localhost:3001/api`  
**Autenticación:** JWT en cookie HttpOnly (`token`). Se establece al hacer login y se envía automáticamente en cada request.

---

## Autenticación

### POST /auth/login
Inicia sesión y establece la cookie de sesión.

**Body:**
```json
{
  "identifier": "ana@activa.edu.mx",
  "password": "Password123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Ana García",
    "email": "ana@activa.edu.mx",
    "role": "librarian"
  },
  "tenant": {
    "id": "uuid",
    "name": "Colegio Activa"
  }
}
```

**Errores:**
- `401` — Credenciales inválidas
- `403` — Tenant suspendido

---

### POST /auth/logout
Cierra la sesión y limpia la cookie.

**Respuesta exitosa (200):**
```json
{ "success": true }
```

---

## Libros

> Todos los endpoints requieren autenticación. Los datos se filtran automáticamente por tenant del usuario autenticado.

### GET /books
Lista todos los libros del tenant (excluye eliminados lógicamente).

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Clean Code",
      "author": "Robert Martin",
      "isbn": "978-0132350884",
      "available": true,
      "statusPhysical": "GOOD",
      "statusLogical": "ACTIVE",
      "locationHall": "General",
      "locationShelf": "A1"
    }
  ]
}
```

---

### POST /books
Crea un nuevo libro en el inventario.

**Body:**
```json
{
  "title": "Clean Code",
  "author": "Robert Martin",
  "isbn": "978-0132350884",
  "locationHall": "General",
  "locationShelf": "A1",
  "publisher": "Prentice Hall",
  "statusPhysical": "GOOD"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": { ...libro creado }
}
```

**Errores:**
- `400` — Campos obligatorios faltantes (title, author, locationHall, locationShelf)

---

### PUT /books/:id
Actualiza los datos de un libro existente (actualización parcial).

**Body (todos los campos son opcionales):**
```json
{
  "title": "Nuevo título",
  "author": "Nuevo autor",
  "available": true,
  "statusPhysical": "DAMAGED"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { ...libro actualizado }
}
```

**Errores:**
- `404` — Libro no encontrado o no pertenece al tenant

---

### DELETE /books/:id
Elimina lógicamente un libro (statusLogical = DELETED_LOGICAL). No borra el registro físicamente para preservar el historial de préstamos.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { ...libro con statusLogical: "DELETED_LOGICAL" }
}
```

**Errores:**
- `404` — Libro no encontrado o no pertenece al tenant

---

## Usuarios

> Requieren autenticación + rol autorizado (librarian, admin_plantel, superadmin).

### GET /users
Lista usuarios del tenant. Soporta filtros por query string.

**Query params opcionales:**
- `?role=student` — Filtra por rol
- `?q=nombre` — Busca por nombre o matrícula

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Luis Pérez",
      "email": "luis@activa.edu.mx",
      "role": "student",
      "studentId": "CCT-ACT-STU-01",
      "department": "Ingeniería"
    }
  ]
}
```

---

### POST /users
Crea un nuevo usuario. Si no se envía password, el sistema genera una contraseña temporal automáticamente y la devuelve en `tempPassword` (solo en esta respuesta, una única vez). Además envía un correo automático al nuevo usuario con sus credenciales vía Brevo.

**Body:**
```json
{
  "name": "María López",
  "email": "maria@activa.edu.mx",
  "role": "student",
  "studentId": "MAT-001",
  "department": "Ciencias",
  "barcode": "MAT-001"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "María López",
    "email": "maria@activa.edu.mx",
    "role": "student",
    "tempPassword": "Bb3kPq9x7M"
  }
}
```

**Errores:**
- `400` — Email, matrícula o barcode duplicado dentro del tenant

---

### PUT /users/:id
Actualiza datos de un usuario existente (actualización parcial).

**Body (todos los campos son opcionales):**
```json
{
  "name": "Nuevo nombre",
  "email": "nuevo@activa.edu.mx",
  "department": "Nuevo departamento"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { ...usuario actualizado, sin campo password }
}
```

---

### DELETE /users/:id
Eliminación lógica de un usuario (isDeleted = true). No borra el registro para preservar el historial de préstamos.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": { ...usuario con isDeleted: true }
}
```

---

## Préstamos

> Requieren autenticación. Los datos se filtran por tenant del usuario autenticado.

### GET /loans
Lista todos los préstamos del tenant. Incluye datos del alumno y del libro en cada préstamo.

**Query params opcionales:**
- `?status=ACTIVE` — Solo préstamos activos
- `?status=RETURNED` — Solo préstamos devueltos

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "dueDate": "2026-07-15T00:00:00.000Z",
      "fineAmount": 0,
      "user": {
        "id": "uuid",
        "name": "Luis Pérez",
        "email": "luis@activa.edu.mx"
      },
      "book": {
        "id": "uuid",
        "title": "Clean Code",
        "author": "Robert Martin"
      }
    }
  ]
}
```

---

### POST /loans
Registra un nuevo préstamo. Marca el libro como no disponible en una transacción atómica.

**Body:**
```json
{
  "userId": "uuid-del-alumno",
  "bookId": "uuid-del-libro",
  "dueDate": "2026-07-15"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "dueDate": "2026-07-15T00:00:00.000Z",
    "user": { ...datos del alumno },
    "book": { ...datos del libro }
  }
}
```

**Errores:**
- `400` — Libro no disponible, alumno o libro no encontrado en el tenant
- `400` — Libro eliminado lógicamente

---

### POST /loans/:id/return
Registra la devolución de un préstamo. Calcula multa automáticamente si hay retraso (días tarde × $5 MXN por defecto). Actualiza el estado físico del libro si se especifica.

**Body:**
```json
{
  "condition": "Bueno"
}
```

> `condition` es opcional. Valores: `"Excelente"`, `"Bueno"`, `"Dañado"`. Se mapea a `statusPhysical` del libro (GOOD/GOOD/DAMAGED).

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "loan": {
      "id": "uuid",
      "status": "RETURNED",
      "returnDate": "2026-07-10T00:00:00.000Z",
      "fineAmount": 25.0
    },
    "book": {
      "id": "uuid",
      "available": true,
      "statusLogical": "ACTIVE",
      "statusPhysical": "GOOD"
    }
  }
}
```

**Errores:**
- `404` — Préstamo no encontrado o no pertenece al tenant
- `400` — Préstamo ya devuelto

---

## API Externa — Brevo (Correo)

Se integró **Brevo** para el envío automático de correos con credenciales cuando se da de alta un nuevo usuario sin contraseña asignada manualmente.

**Flujo:**
1. Bibliotecario crea alumno via `POST /api/users` sin campo `password`
2. Backend genera contraseña temporal segura (10 caracteres, sin símbolos ambiguos)
3. Backend llama a la API de Brevo para enviar correo al alumno con sus credenciales
4. La contraseña también se devuelve en `tempPassword` en la respuesta (solo esa vez)
5. El envío del correo es no bloqueante — si falla, el usuario se crea igual

**Variable de entorno requerida:**
```
BREVO_API_KEY=tu_api_key_de_brevo
```

---

## Seguridad

| Capa | Implementación |
|------|---------------|
| Autenticación | JWT firmado con `JWT_SECRET`, entregado en cookie HttpOnly |
| Cookie segura | `secure: true` en producción, `sameSite: none` para cross-domain en Railway |
| Protección de rutas (backend) | Middleware `authGuard` en todos los endpoints protegidos |
| Aislamiento multi-tenant | `tenantId` inyectado desde JWT en cada query, nunca desde el cliente |
| RBAC | Middleware `roleGuard` para endpoints que requieren roles específicos |
| Validación de datos | Zod en todos los endpoints antes de tocar la base de datos |
| Rate limiting | `express-rate-limit`: máx 150 requests/minuto |
| Variables de entorno | `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `BREVO_API_KEY` en `.env` |
| Protección de rutas (frontend) | Componente `ProtectedRoute` redirige al login si no hay sesión |

---

*Última actualización: Julio 2026 — Versión MVP 0.3.0*
