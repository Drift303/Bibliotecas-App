const prisma = require('../config/prismaClient');
const {
  createBookSchema,
  updateBookSchema,
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

module.exports = {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
};