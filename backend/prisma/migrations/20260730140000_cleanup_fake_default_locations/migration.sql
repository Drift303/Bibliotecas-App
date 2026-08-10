-- DataMigration
-- Antes del fix, TODO libro creado desde Inventario, la Auditoría Anual o
-- import/bulk se guardaba con locationHall='General' y locationShelf='A1'
-- de forma automática, sin que nadie los capturara de verdad. Esos valores
-- no son ubicación real: son el placeholder que dejaba el código viejo.
--
-- Esta combinación exacta ('General' + 'A1' juntos) es la firma del bug,
-- así que la limpiamos para que esos libros vuelvan a aparecer como
-- "Sin ubicar" en vez de "Ubicado" con un dato falso.
UPDATE "Book"
SET "locationHall" = NULL, "locationShelf" = NULL
WHERE "locationHall" = 'General' AND "locationShelf" = 'A1';
