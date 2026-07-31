-- AlterTable
-- Agrega Fila / Columna (para ubicación en estante) y un campo libre de
-- ubicación en almacén, para la pantalla dedicada "Mapear ubicación".
-- Todos nullable: un libro puede no tener ninguno capturado todavía.
ALTER TABLE "Book" ADD COLUMN "locationRow" TEXT;
ALTER TABLE "Book" ADD COLUMN "locationColumn" TEXT;
ALTER TABLE "Book" ADD COLUMN "storageLocation" TEXT;
