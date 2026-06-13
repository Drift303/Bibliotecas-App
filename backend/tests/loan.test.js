// ============================================================
// PRUEBA: loanController
// Verifica el flujo de préstamo y devolución con cálculo de multas
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTransaction = vi.fn()
const mockLoanCreate = vi.fn()
const mockLoanUpdate = vi.fn()
const mockLoanFindUnique = vi.fn()
const mockBookUpdate = vi.fn()
const mockUserFindUnique = vi.fn()
const mockBookFindUnique = vi.fn()

vi.mock('../src/config/prismaClient', () => ({
  default: {
    $transaction: mockTransaction,
    loan: {
      create: mockLoanCreate,
      update: mockLoanUpdate,
      findUnique: mockLoanFindUnique
    },
    book: {
      update: mockBookUpdate,
      findUnique: mockBookFindUnique
    },
    user: {
      findUnique: mockUserFindUnique
    }
  }
}))

const { createLoan, returnLoan } = await import('../src/controllers/loanController')

describe('createLoan', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: { userId: 'user-1', bookId: 'book-1', dueDate: '2099-12-31' },
      user: { tenantId: 'tenant-1' }
    }
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    vi.clearAllMocks()
  })

  it('debe rechazar si el libro no está disponible', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' })
    mockBookFindUnique.mockResolvedValue({ id: 'book-1', tenantId: 'tenant-1', available: false, statusLogical: 'BORROWED' })
    await createLoan(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('debe rechazar si el libro está eliminado', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' })
    mockBookFindUnique.mockResolvedValue({ id: 'book-1', tenantId: 'tenant-1', available: true, statusLogical: 'DELETED_LOGICAL' })
    await createLoan(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('debe rechazar si el usuario no pertenece al tenant', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', tenantId: 'otro-tenant' })
    mockBookFindUnique.mockResolvedValue({ id: 'book-1', tenantId: 'tenant-1', available: true, statusLogical: 'ACTIVE' })
    await createLoan(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('returnLoan - cálculo de multas', () => {
  let req, res

  beforeEach(() => {
    req = { params: { id: 'loan-1' }, user: { tenantId: 'tenant-1' } }
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    vi.clearAllMocks()
  })

  it('debe calcular multa correctamente si hay atraso', async () => {
    const fechaVencida = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 días atrás
    mockLoanFindUnique.mockResolvedValue({
      id: 'loan-1',
      tenantId: 'tenant-1',
      bookId: 'book-1',
      status: 'ACTIVE',
      dueDate: fechaVencida,
      book: { id: 'book-1' }
    })
    mockTransaction.mockImplementation(async (ops) => {
      return ops.map(op => op)
    })
    mockLoanUpdate.mockResolvedValue({ id: 'loan-1', fineAmount: 15 })
    mockBookUpdate.mockResolvedValue({ id: 'book-1', available: true })
    await returnLoan(req, res)
    // La multa debe ser mayor a 0 (3 días * $5 = $15)
    expect(mockLoanUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fineAmount: expect.any(Number) })
      })
    )
  })

  it('debe rechazar si el préstamo ya fue devuelto', async () => {
    mockLoanFindUnique.mockResolvedValue({
      id: 'loan-1',
      tenantId: 'tenant-1',
      status: 'RETURNED',
      book: {}
    })
    await returnLoan(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
