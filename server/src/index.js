import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from './auth.js'
import { initDb } from './db.js'
import jobsRouter from './routes/jobs.js'
import authRouter from './routes/auth.js'
import statsRouter from './routes/stats.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', authRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/stats', statsRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message)
    process.exit(1)
  })
