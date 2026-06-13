// ============================================================
// PRUEBA: saasGuard middleware
// Verifica que el middleware bloquee tenants suspendidos
// y permita el paso a tenants activos.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
vi.mock('../src/config/prismaClient', () => ({
  default: {
    tenant: {
      findUnique: mockFindUnique
    }
  }
}))

const saasGuard = (await import('../src/middlewares/saasGuard')).default

describe('saasGuard middleware', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {}, user: {} }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    next = vi.fn()
    mockFindUnique.mockReset()
  })

  it('debe bloquear si no hay tenantId', async () => {
    req.body = {}
    await saasGuard(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('debe bloquear si el tenant no existe', async () => {
    req.body.tenantId = 'id-inexistente'
    mockFindUnique.mockResolvedValue(null)
    await saasGuard(req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(next).not.toHaveBeenCalled()
  })

  it('debe bloquear si el tenant está SUSPENDED', async () => {
    req.body.tenantId = 'id-suspendido'
    mockFindUnique.mockResolvedValue({ id: 'id-suspendido', status: 'SUSPENDED' })
    await saasGuard(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('debe permitir el paso si el tenant está ACTIVE', async () => {
    req.body.tenantId = 'id-activo'
    mockFindUnique.mockResolvedValue({ id: 'id-activo', status: 'ACTIVE' })
    await saasGuard(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
