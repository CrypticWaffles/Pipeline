import { Router } from 'express'
import passport from '../auth.js'
import { signToken } from '../jwt.js'

const router = Router()
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}?error=auth_failed`, session: false }),
  (req, res) => {
    const token = signToken(req.user)
    res.redirect(`${CLIENT_URL}?token=${token}`)
  }
)

router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ user: null })
  const { id, email, name, avatar } = req.user
  res.json({ user: { id, email, name, avatar } })
})

export default router
