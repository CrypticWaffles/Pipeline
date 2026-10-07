import express from 'express'
import request from 'supertest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../db.js'
import accountRouter from './account.js'

vi.mock('../db.js', () => ({
  pool: { query: vi.fn() },
}))

function buildApp(user = { id: 'user-1' }) {
  const app = express()
  app.use((req, _res, next) => {
    if (user) req.user = user
    next()
  })
  app.use('/api/account', accountRouter)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'Internal server error' }))
  return app
}

beforeEach(() => {
  pool.query.mockReset()
})

describe('DELETE /api/account', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(buildApp(null)).delete('/api/account')
    expect(res.status).toBe(401)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('deletes the authenticated user and returns 204', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 })

    const res = await request(buildApp()).delete('/api/account')

    expect(res.status).toBe(204)
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['user-1'])
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection lost'))

    const res = await request(buildApp()).delete('/api/account')

    expect(res.status).toBe(500)
  })
})
