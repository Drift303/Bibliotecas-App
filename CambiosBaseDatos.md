# Cambios en la Base de Datos - Panel de Bibliotecario

## Nuevos Campos Añadidos

- **User**:
  - `contactEmail` (String, opcional): Para contacto en bibliotecas públicas, separado del email ficticio de login.
  - `contactPhone` (String, opcional): Teléfono de contacto alternativo o complementario.
- **Tenant**:
  - `finePerDay` (Float, por defecto 5.0): Define el monto configurable de multa por día para los préstamos vencidos en cada plantel/biblioteca.
- **Book**:
  - `replacementCost` (Float, opcional): El costo de reposición del libro en caso de ser extraviado.
- **Loan**:
  - `lastReminderSentAt` (DateTime, opcional): Fecha y hora del último recordatorio de vencimiento enviado, para saber quién ya ha sido notificado en el día de hoy.

## Nuevos Modelos

- **Department**:
  - Modelo para almacenar el catálogo de departamentos/carreras gestionados por las escuelas.
  - Campos: `id`, `tenantId`, `name`, `createdAt`.
  - Relación con `Tenant` (con borrado en cascada).
  - Constrains: `@@unique([tenantId, name])` y `@@index([tenantId])`.

## Cómo aplicarlos en producción de forma segura

1. Acceder al entorno de despliegue donde se encuentre la aplicación (ej. servidor, contenedores Docker, Railway, etc).
2. Asegurarse de tener configurada la variable de entorno `DATABASE_URL` apuntando a la base de datos de producción.
3. Ejecutar el comando para aplicar migraciones pendientes:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. Confirmar que los cambios se aplicaron exitosamente en los logs.
5. Adicionalmente, el frontend debe ser actualizado concurrentemente para que pueda comenzar a enviar y leer los nuevos campos en las APIs, y la lógica de negocio del backend responderá con las nuevas estructuras.
6. En caso de requerir una migración de datos para convertir departamentos de alumnos a entradas de la tabla `Department`, se ejecutará un script de inicialización posterior.
