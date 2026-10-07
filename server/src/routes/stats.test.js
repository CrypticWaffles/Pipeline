import express from 'express'
import request from 'supertest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../db.js'
import statsRouter from './stats.js'

vi.mock('../db.js', () => ({
  pool: { query: vi.fn() },
}))

function buildApp(user = { id: 'user-1' }) {
  const app = express()
  app.use((req, _res, next) => {
    if (user) req.user = user
    next()
  })
  app.use('/api/stats', statsRouter)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'Internal server error' }))
  return app
}

beforeEach(() => {
  pool.query.mockReset()
})

describe('GET /api/stats', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(buildApp(null)).get('/api/stats')
    expect(res.status).toBe(401)
  })

  it('aggregates stage counts into summary metrics', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { stage: 'Applied', count: 5, avg_days: 2 },
          { stage: 'Interview', count: 3, avg_days: 7 },
          { stage: 'Offer', count: 1, avg_days: 14 },
          { stage: 'Rejected', count: 2, avg_days: 3 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ week: 'Jan 01', count: 4 }] })

    const res = await request(buildApp()).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(11)
    expect(res.body.active).toBe(9)
    expect(res.body.responseRate).toBe(Math.round((4 / 11) * 100))
    expect(res.body.offerRate).toBe(Math.round((1 / 11) * 100))
    expect(res.body.weekly).toEqual([{ week: 'Jan 01', count: 4 }])
  })

  it('returns zeroed rates when the user has no jobs', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await request(buildApp()).get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      total: 0,
      active: 0,
      responseRate: 0,
      offerRate: 0,
      byStage: [],
      weekly: [],
    })
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection lost'))

    const res = await request(buildApp()).get('/api/stats')

    expect(res.status).toBe(500)
  })
})
