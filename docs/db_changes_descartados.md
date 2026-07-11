# Cambio en Base de Datos: Estado "Descartado"

**Fecha:** 2026-07-06
**Descripción:** Se agregó un nuevo estado físico para los libros (`DISCARDED`) para representar los libros que han sido dados de baja de manera permanente por deterioro u obsolescencia, diferenciándolos de los extraviados (`LOST`).

## Esquema Prisma (`backend/prisma/schema.prisma`)
Se modificó el enum `PhysicalStatus`:
```prisma
enum PhysicalStatus {
  GOOD
  DAMAGED
  LOST
  DISCARDED
}
```

## Instrucciones para Despliegue en Producción
Para aplicar este cambio en el entorno de producción sin pérdida de datos:
1. Asegurarse de que el servidor no está recibiendo tráfico.
2. Ejecutar: `npx prisma migrate deploy`
3. Ejecutar: `npx prisma generate`
4. Reiniciar el servidor de Node.js.
