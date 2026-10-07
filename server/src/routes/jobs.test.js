import express from 'express'
import request from 'supertest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pool } from '../db.js'
import jobsRouter from './jobs.js'

vi.mock('../db.js', () => ({
  pool: { query: vi.fn() },
}))

function buildApp(user = { id: 'user-1' }) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    if (user) req.user = user
    next()
  })
  app.use('/api/jobs', jobsRouter)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => res.status(500).json({ error: 'Internal server error' }))
  return app
}

const SAMPLE_JOB = {
  id: 'job-1',
  user_id: 'user-1',
  company: 'Acme',
  role: 'Engineer',
  salary: null,
  stage: 'Applied',
  notes: null,
  link: null,
}

beforeEach(() => {
  pool.query.mockReset()
})

describe('GET /api/jobs', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(buildApp(null)).get('/api/jobs')
    expect(res.status).toBe(401)
  })

  it('returns the jobs for the authenticated user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SAMPLE_JOB] })

    const res = await request(buildApp()).get('/api/jobs')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([SAMPLE_JOB])
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM jobs'), ['user-1'])
  })

  it('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('connection lost'))

    const res = await request(buildApp()).get('/api/jobs')

    expect(res.status).toBe(500)
  })
})

describe('POST /api/jobs', () => {
  it('requires company and role', async () => {
    const res = await request(buildApp()).post('/api/jobs').send({ company: 'Acme' })

    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('creates a job for the authenticated user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SAMPLE_JOB] })

    const res = await request(buildApp())
      .post('/api/jobs')
      .send({ company: 'Acme', role: 'Engineer' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual(SAMPLE_JOB)
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO jobs'),
      ['user-1', 'Acme', 'Engineer', null, 'Applied', null, null]
    )
  })
})

describe('PATCH /api/jobs/:id', () => {
  it('updates a job and returns it', async () => {
    const updated = { ...SAMPLE_JOB, stage: 'Interview' }
    pool.query.mockResolvedValueOnce({ rows: [updated] })

    const res = await request(buildApp())
      .patch('/api/jobs/job-1')
      .send({ stage: 'Interview' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(updated)
  })

  it('returns 404 when no matching job exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(buildApp())
      .patch('/api/jobs/missing')
      .send({ stage: 'Interview' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/jobs/:id', () => {
  it('deletes a job and returns 204', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 })

    const res = await request(buildApp()).delete('/api/jobs/job-1')

    expect(res.status).toBe(204)
  })

  it('returns 404 when no matching job exists', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 })

    const res = await request(buildApp()).delete('/api/jobs/missing')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/jobs/import', () => {
  it('rejects an empty array', async () => {
    const res = await request(buildApp()).post('/api/jobs/import').send([])

    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('skips invalid rows and inserts only valid ones', async () => {
    pool.query.mockResolvedValueOnce({ rows: [SAMPLE_JOB] })

    const res = await request(buildApp())
      .post('/api/jobs/import')
      .send([{ company: 'Acme', role: 'Engineer' }, { company: 'MissingRole' }])

    expect(res.status).toBe(201)
    expect(res.body).toEqual([SAMPLE_JOB])
    const [, params] = pool.query.mock.calls[0]
    expect(params).toEqual(['user-1', 'Acme', 'Engineer', null, 'Applied', null, null])
  })

  it('returns 400 when every row is invalid', async () => {
    const res = await request(buildApp())
      .post('/api/jobs/import')
      .send([{ company: 'NoRole' }])

    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })
})
