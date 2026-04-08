import { Router } from 'express'
import passport from '../auth.js'

const router = Router()
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login` }),
  (_req, res) => res.redirect(CLIENT_URL)
)

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)
    res.json({ ok: true })
  })
})

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ user: null })
  const { id, email, name, avatar } = req.user
  res.json({ user: { id, email, name, avatar } })
})

export default router
