const prisma = require('../config/prismaClient');
const {
  createBookSchema,
  updateBookSchema,
  createBooksBulkSchema,
} = require('../validators/bookValidators');

const getBooks = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Missing tenant context' });
    }

    const books = await prisma.book.findMany({
      where: {
        tenantId,
        statusLogical: { not: 'DELETED_LOGICAL' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: books,
    });
  } catch (err) {
    console.error('getBooks error', err);
    res.status(500).json({
      error: 'Failed to fetch books',
    });
  }
};

const createBook = async (req, res) => {
  try {
    const parsed = createBookSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const tenantId = req.user && req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Missing tenant context',
      });
    }

    const data = parsed.data;

    const bookData = {
      tenantId,
      title: data.title.trim(),
      author: data.author.trim(),
      locationHall: data.locationHall.trim(),
      locationShelf: data.locationShelf.trim(),
      isbn: data.isbn ? data.isbn.trim() : null,
      publisher: data.publisher ? data.publisher.trim() : null,
      statusPhysical: data.statusPhysical || 'GOOD',
      qrCode: data.qrCode || null,
    };

    const created = await prisma.book.create({
      data: bookData,
    });

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    console.error('createBook error', err);
    res.status(500).json({
      error: 'Failed to create book',
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Missing tenant context',
      });
    }

    const parsed = updateBookSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const existing = await prisma.book.findFirst({
      where: {
        id: req.params.id,
        tenantId,
        statusLogical: {
          not: 'DELETED_LOGICAL',
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Book not found',
      });
    }

    const updated = await prisma.book.update({
      where: {
        id: req.params.id,
      },
      data: parsed.data,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('updateBook error', err);
    res.status(500).json({
      error: 'Failed to update book',
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Missing tenant context',
      });
    }

    const existing = await prisma.book.findFirst({
      where: {
        id: req.params.id,
        tenantId,
        statusLogical: {
          not: 'DELETED_LOGICAL',
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Book not found',
      });
    }

    await prisma.book.update({
      where: {
        id: req.params.id,
      },
      data: {
        statusLogical: 'DELETED_LOGICAL',
      },
    });

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (err) {
    console.error('deleteBook error', err);
    res.status(500).json({
      error: 'Failed to delete book',
    });
  }
};

const createBooksBulk = async (req, res) => {
  try {
    const parsed = createBooksBulkSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.format(),
      });
    }

    const tenantId = req.user && req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Missing tenant context',
      });
    }

    const booksData = parsed.data.books.map((data) => ({
      tenantId,
      title: data.title.trim(),
      author: data.author.trim(),
      locationHall: data.locationHall.trim(),
      locationShelf: data.locationShelf.trim(),
      isbn: data.isbn ? data.isbn.trim() : null,
      publisher: data.publisher ? data.publisher.trim() : null,
      statusPhysical: data.statusPhysical || 'GOOD',
      available: data.available === true,
      statusLogical: 'ACTIVE'
    }));

    const created = await prisma.book.createMany({
      data: booksData,
      skipDuplicates: true, // Prisma ignora conflictos si los hay a nivel BD
    });

    res.status(201).json({
      success: true,
      data: { count: created.count },
    });
  } catch (err) {
    console.error('createBooksBulk error', err);
    res.status(500).json({
      error: 'Failed to create books in bulk',
    });
  }
};

/**
 * Importación masiva de libros.
 * Recibe un array de objetos con campos mapeados: title, author, isbn, qrCode, etc.
 * Si un libro ya tiene un qrCode existente en la BD, se omite (no se duplica).
 */
const importBooks = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Missing tenant context' });
    }

    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: 'No books provided for import' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const book of books) {
      try {
        // Si el libro trae qrCode, verificar si ya existe en la BD para este tenant
        if (book.qrCode) {
          const existingQr = await prisma.book.findFirst({
            where: { tenantId, qrCode: book.qrCode, statusLogical: { not: 'DELETED_LOGICAL' } },
          });
          if (existingQr) {
            skipped++;
            continue; // Ya existe, no duplicar
          }
        }

        // Si trae ISBN, verificar si ya existe un libro con ese ISBN para este tenant
        if (book.isbn) {
          const existingIsbn = await prisma.book.findFirst({
            where: { tenantId, isbn: book.isbn, statusLogical: { not: 'DELETED_LOGICAL' } },
          });
          if (existingIsbn) {
            skipped++;
            continue;
          }
        }

        await prisma.book.create({
          data: {
            tenantId,
            title: (book.title || 'Sin título').trim(),
            author: (book.author || 'Desconocido').trim(),
            isbn: book.isbn ? book.isbn.trim() : null,
            publisher: book.publisher ? book.publisher.trim() : null,
            locationHall: book.locationHall || 'General',
            locationShelf: book.locationShelf || 'A1',
            statusPhysical: 'GOOD',
            qrCode: book.qrCode || null,
          },
        });
        imported++;
      } catch (bookErr) {
        errors.push(`Error importing "${book.title || 'unknown'}": ${bookErr.message}`);
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Importados: ${imported}, Omitidos (duplicados): ${skipped}`,
    });
  } catch (err) {
    console.error('importBooks error', err);
    res.status(500).json({ error: 'Failed to import books' });
  }
};

module.exports = {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  createBooksBulk,
  importBooks,
};