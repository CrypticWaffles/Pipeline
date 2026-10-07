import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// DELETE /api/account — deletes the authenticated user; their jobs cascade via FK
router.delete('/', asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  await pool.query('DELETE FROM users WHERE id = $1', [req.user.id])
  res.status(204).end()
}))

export default router
