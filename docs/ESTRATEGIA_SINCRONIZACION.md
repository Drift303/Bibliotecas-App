# Estrategia de Sincronización Offline

## ¿Qué problema resuelve?
El bibliotecario puede perder conexión a internet mientras registra préstamos.
Esta estrategia garantiza que esas operaciones no se pierdan y lleguen al servidor cuando vuelva la red.

---

## Flujo general

```
[Bibliotecario sin red]
        |
        v
  PWA guarda operación
  en IndexedDB (Dexie.js)
        |
  ... espera red ...
        |
        v
  PWA detecta conexión
  y envía cola al backend
        |
        v
  Backend valida y procesa
  cada operación en orden
        |
        v
  Guarda resultado en
  tabla SyncQueue (BD)
```

---

## Operaciones soportadas

| Operación | Descripción |
|---|---|
| `CREATE_LOAN` | Registrar un préstamo nuevo |
| `RETURN_LOAN` | Registrar una devolución |
| `RETIRE_BOOK` | Dar de baja un libro |

---

## Estructura del payload (lo que envía el frontend)

Cada operación viaja así:

```json
{
  "operation": "CREATE_LOAN",
  "clientTime": "2026-06-05T01:00:00.000Z",
  "tenantId": "uuid-de-la-escuela",
  "payload": {
    "bookId": "uuid-del-libro",
    "studentId": "uuid-del-alumno",
    "librarianId": "uuid-del-bibliotecario",
    "dueDate": "2026-06-12T01:00:00.000Z"
  }
}
```

> `clientTime` es el momento exacto en que se registró sin red.
> Se usa para procesar las operaciones en el orden correcto.

---

## Reglas de validación (backend)

Antes de procesar cada operación, el backend debe verificar:

1. El `tenantId` existe y está **ACTIVE**
2. El libro no fue dado de baja mientras el bibliotecario estaba offline
3. El libro sigue **AVAILABLE** (no fue prestado por otra persona)
4. El alumno existe y está activo en ese tenant

Si alguna validación falla → marcar operación como `FAILED` con mensaje de error y continuar con la siguiente.

---

## Estados de SyncQueue

| Estado | Significado |
|---|---|
| `PENDING` | Recibida, esperando procesarse |
| `SYNCED` | Procesada exitosamente |
| `FAILED` | Falló la validación, ver `errorMsg` |

---

## Endpoint esperado (para Germán)

```
POST /api/sync
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  "operations": [ ...array de operaciones... ]
}
```

El backend procesa cada operación en orden por `clientTime` y responde con el resultado de cada una.

---

## Notas importantes

- Las operaciones se procesan **en orden** por `clientTime`, nunca en paralelo
- Si una operación falla, las demás **siguen procesándose** (no se cancela todo)
- El frontend debe limpiar su IndexedDB solo cuando reciba confirmación `SYNCED`
- En modo SQLite (localhost) la sincronización no aplica — todo es local

