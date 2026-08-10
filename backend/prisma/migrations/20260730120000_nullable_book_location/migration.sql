-- AlterTable
-- Permite que locationHall / locationShelf queden sin capturar (NULL) en vez de
-- forzar un valor. Antes de este cambio la columna era NOT NULL, lo que obligaba
-- al frontend a rellenar con valores falsos ("General"/"A1") para poder guardar
-- un libro sin ubicación conocida.
ALTER TABLE "Book" ALTER COLUMN "locationHall" DROP NOT NULL;
ALTER TABLE "Book" ALTER COLUMN "locationShelf" DROP NOT NULL;
