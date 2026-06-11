# 🧪 Guía de Pruebas Postman - Bibliotecas App

## 📋 Credenciales Correctas (v0.2.0)

### Tenant: `activa.edu.mx` (ACTIVE)
| Usuario | Email | CCT | Password | Rol | Propósito |
|---|---|---|---|---|---|
| Ana Bibliotecaria | `ana@activa.edu.mx` | `CCT-ACT-001` | `Password123!` | librarian | **Login principal para pruebas** |
| Luis Alumno | `luis@activa.edu.mx` | `CCT-ACT-STU-01` | `Alumno123!` | student | Pruebas RBAC (debe dar 403 en /api/users) |

### Tenant: `suspendida.edu.mx` (SUSPENDED)
| Usuario | Email | Password | Rol | Propósito |
|---|---|---|---|---|
| María Bibliotecaria | `maria@suspendida.edu.mx` | `Password123!` | librarian | **Prueba saasGuard (debe dar 403 en cualquier endpoint)** |
| Pedro Alumno | `pedro@suspendida.edu.mx` | `Alumno123!` | student | - |

---

## ✅ Flujo de Pruebas (En Orden)

### Paso 0: Pre-requisitos
1. Asegúrate de que el seed se ejecutó:
```bash
docker compose exec backend npm run seed
```

2. Verifica que los contenedores están healthy:
```bash
docker compose ps
# Todos deben mostrar "healthy"
```

3. Abre Postman y **activa la cookie jar** (Settings → Cookies):
   - Esto permite capturar la cookie `token` automáticamente en cada login
   - Las siguientes peticiones incluirán la cookie automáticamente

4. Importa `backend/postman_collection.json`:
   - File → Import → selecciona el archivo
   - El baseUrl debe ser `http://localhost:3001` (default)

---

### Paso 1: Login Librarian (Ana) ✅
**Request**: `Login - por email institucional (librarian)`

```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "identifier": "ana@activa.edu.mx",
  "password": "Password123!"
}
```

**Respuesta esperada**: 
- Status: `200 OK`
- Body: `{ "message": "Login successful" }`
- **Cookie Set**: `token=eyJh...` (capturada automáticamente por Postman)

**Si falla**: Error 401 "Invalid credentials"
- Solución: Re-ejecuta seed: `docker compose exec backend npm run seed`

---

### Paso 2: Get Books (Usa Cookie) ✅
**Request**: `Books → Get Books`

```
GET http://localhost:3001/api/books
```

**Respuesta esperada**: 
- Status: `200 OK`
- Body: Array con 5 libros (Cien años de soledad, Don Quijote, La Odisea, El Principito, 1984)
- Ejemplo:
```json
[
  {
    "id": "uuid-1",
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "available": true,
    "statusLogical": "ACTIVE"
  },
  ...
]
```

**Si falla**: Error 401 "No valid JWT in cookie"
- Solución: Primero haz login (Paso 1) para capturar la cookie

---

### Paso 3: List Users (Librarian Privilege) ✅
**Request**: `Users → List Users (as librarian)`

```
GET http://localhost:3001/api/users
```

**Respuesta esperada**: 
- Status: `200 OK`
- Body: Array con usuarios (Ana + Luis + cualquier otro creado)
```json
[
  {
    "id": "uuid-1",
    "name": "Ana Bibliotecaria",
    "email": "ana@activa.edu.mx",
    "role": "librarian",
    "isDeleted": false
  },
  {
    "id": "uuid-2",
    "name": "Luis Alumno",
    "email": "luis@activa.edu.mx",
    "role": "student",
    "isDeleted": false
  }
]
```

---

### Paso 4: Create User (Librarian Privilege) ✅
**Request**: `Users → Create User - válido (alumno)`

```
POST http://localhost:3001/api/users
Content-Type: application/json

{
  "name": "Marcos Estudiante",
  "email": "marcos@activa.edu.mx",
  "role": "student",
  "studentId": "STU-ACT-0002",
  "department": "Primaria",
  "barcode": "BAR-ACT-0002"
}
```

**Respuesta esperada**: 
- Status: `201 Created`
- Body: Usuario creado
```json
{
  "id": "uuid-3",
  "name": "Marcos Estudiante",
  "email": "marcos@activa.edu.mx",
  "role": "student",
  "studentId": "STU-ACT-0002"
}
```

---

### Paso 5: Create User - RBAC Test (Expect 403) ❌
**Request**: `Users → Create User - as student (expect 403) [login as luis first]`

**Antes de hacer esta request:**
1. Haz login como **Luis** (student):
```
POST http://localhost:3001/api/auth/login
{
  "identifier": "luis@activa.edu.mx",
  "password": "Alumno123!"
}
```
- Resultado: cookie actualizada a usuario `luis` (student)

2. Ahora intenta crear usuario:
```
POST http://localhost:3001/api/users
{
  "name": "Pedro intento",
  "email": "pedro2@activa.edu.mx",
  "role": "student",
  "studentId": "STU-ACT-999",
  "department": "Primaria",
  "barcode": "BAR-ACT-999"
}
```

**Respuesta esperada**: 
- Status: `403 Forbidden`
- Body: `{ "error": "Forbidden: insufficient permissions" }` o similar
- **Por qué**: Luis es `student`, solo `librarian`, `admin_plantel`, `superadmin` pueden crear usuarios.

---

### Paso 6: Validación de Input (400) ❌
**Request**: `Users → Create User - inválido (email mal formado)`

```
POST http://localhost:3001/api/users
{
  "name": "X",
  "email": "not-an-email",
  "role": "student",
  "studentId": "STU-ACT-0003",
  "department": "Primaria",
  "barcode": "BAR-ACT-0003"
}
```

**Respuesta esperada**: 
- Status: `400 Bad Request`
- Body: Error Zod con detalles (email inválido)
```json
{
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

---

### Paso 7: Duplicate Detection (400) ❌
**Request**: `Users → Create User - duplicado (studentId) expect 400`

```
POST http://localhost:3001/api/users
{
  "name": "Alumno Duplicado",
  "email": "dup@activa.edu.mx",
  "role": "student",
  "studentId": "STU-ACT-0001",
  "department": "Primaria",
  "barcode": "BAR-ACT-9999"
}
```

**Respuesta esperada**: 
- Status: `400 Bad Request`
- Body: `{ "error": "studentId already exists for this tenant" }` o similar
- **Por qué**: Luis ya tiene `studentId: STU-ACT-0001` en el tenant `activa.edu.mx`

---

### Paso 8: SaaS Guard Test (Suspended Tenant - 403) ❌
**Request**: `Login - tenant suspendido (espera 403)`

```
POST http://localhost:3001/api/auth/login
{
  "identifier": "maria@suspendida.edu.mx",
  "password": "Password123!"
}
```

**Respuesta esperada**: 
- Status: `403 Forbidden`
- Body: `{ "error": "Tenant is suspended" }` o similar
- **Por qué**: El tenant `suspendida.edu.mx` tiene `status: SUSPENDED`

---

### Paso 9: Books - Create Book (Bonus) ✅
**Request**: `Books → Create Book - válido`

Primero, haz login como Ana (Paso 1) para que tengas la cookie de librarian.

```
POST http://localhost:3001/api/books
{
  "title": "La casa de los espíritus",
  "author": "Isabel Allende",
  "locationHall": "D",
  "locationShelf": "4",
  "isbn": "9780060883252",
  "publisher": "Plaza & Janés"
}
```

**Respuesta esperada**: 
- Status: `201 Created`
- Body: Libro creado

---

## 🔍 Troubleshooting

### ❌ Error: "Invalid credentials" en todos los logins
**Causa**: Seed no ejecutado o BD vacía.
**Solución**:
```bash
docker compose exec backend npm run seed
# Verifica output: debe decir "Seeding finished"
```

### ❌ Error: "No valid JWT in cookie" en GET /api/books
**Causa**: No hiciste login antes.
**Solución**: Haz login primero (Paso 1).

### ❌ Error: "Tenant is suspended" en login exitoso pero endpoints fallan
**Causa**: Estás con sesión de tenant suspendido.
**Solución**: Haz login de nuevo con `ana@activa.edu.mx` (tenant ACTIVE).

### ❌ Error: "401 Unauthorized" en endpoints GET
**Causa**: Cookie expirada o limpiada.
**Solución**: Re-haz login (Paso 1).

---

## 📊 Resumen de Respuestas

| Endpoint | Con Ana (librarian) | Con Luis (student) | Con Maria (suspended) |
|---|---|---|---|
| GET /api/books | 200 ✅ | 200 ✅ | 403 ❌ |
| GET /api/users | 200 ✅ | 403 ❌ | 403 ❌ |
| POST /api/users | 201 ✅ | 403 ❌ | 403 ❌ |
| POST /api/auth/login (maria) | - | - | 403 ❌ |

---

## 🎯 Checklist Final

- [ ] Seed ejecutado exitosamente
- [ ] Postman importado y cookie jar activo
- [ ] Login Ana exitoso (200 OK)
- [ ] Get Books funciona (5 libros)
- [ ] List Users funciona (Ana + Luis)
- [ ] Create User funciona (nuevo alumno)
- [ ] RBAC test funciona (Luis → 403)
- [ ] Validación test funciona (email mal → 400)
- [ ] Duplicate test funciona (studentId duplicate → 400)
- [ ] Suspended tenant test funciona (Maria → 403)

---

**Última actualización**: Junio 6, 2026 | Backend v0.2.0
