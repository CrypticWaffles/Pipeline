import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  const uid = req.user.id

  const [byStagResult, weeklyResult] = await Promise.all([
    pool.query(
      `SELECT
         stage,
         COUNT(*)::int                                                   AS count,
         ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400))::int AS avg_days
       FROM jobs
       WHERE user_id = $1
       GROUP BY stage`,
      [uid]
    ),
    pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
         COUNT(*)::int                                      AS count
       FROM jobs
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '10 weeks'
       GROUP BY DATE_TRUNC('week', created_at)
       ORDER BY DATE_TRUNC('week', created_at)`,
      [uid]
    ),
  ])

  const byStage = byStagResult.rows
  const total   = byStage.reduce((sum, r) => sum + r.count, 0)
  const active  = byStage.filter(r => r.stage !== 'Rejected').reduce((sum, r) => sum + r.count, 0)
  const responded = byStage.filter(r => !['Applied', 'Rejected'].includes(r.stage)).reduce((sum, r) => sum + r.count, 0)
  const offers  = byStage.find(r => r.stage === 'Offer')?.count ?? 0

  res.json({
    total,
    active,
    responseRate: total ? Math.round((responded / total) * 100) : 0,
    offerRate:    total ? Math.round((offers    / total) * 100) : 0,
    byStage,
    weekly: weeklyResult.rows,
  })
})

export default router
