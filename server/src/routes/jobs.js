import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

router.use(requireAuth)

// GET /api/jobs
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  )
  res.json(rows)
})

// POST /api/jobs
router.post('/', async (req, res) => {
  const { company, role, salary, stage, notes, link } = req.body
  if (!company || !role) return res.status(400).json({ error: 'company and role are required' })

  const { rows } = await pool.query(
    `INSERT INTO jobs (user_id, company, role, salary, stage, notes, link)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.user.id, company, role, salary ?? null, stage ?? 'Applied', notes ?? null, link ?? null]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/jobs/:id
router.patch('/:id', async (req, res) => {
  const { company, role, salary, stage, notes, link } = req.body
  const { rows } = await pool.query(
    `UPDATE jobs SET
       company    = COALESCE($1, company),
       role       = COALESCE($2, role),
       salary     = COALESCE($3, salary),
       stage      = COALESCE($4, stage),
       notes      = COALESCE($5, notes),
       link       = COALESCE($6, link),
       updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [company, role, salary, stage, notes, link, req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'not found' })
  res.json(rows[0])
})

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM jobs WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'not found' })
  res.status(204).end()
})

export default router
