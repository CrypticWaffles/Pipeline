import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from './auth.js'
import { jwtMiddleware } from './jwt.js'
import { initDb } from './db.js'
import jobsRouter from './routes/jobs.js'
import authRouter from './routes/auth.js'
import statsRouter from './routes/stats.js'

const PORT = process.env.PORT ?? 3001
const SESSION_SECRET = process.env.SESSION_SECRET

if (!SESSION_SECRET) {
  console.error('SESSION_SECRET environment variable must be set')
  process.exit(1)
}

const app = express()

app.set('trust proxy', 1)
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(session({
  secret: SESSION_SECRET,
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
app.use(jwtMiddleware)

app.use('/auth', authRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/stats', statsRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message)
    process.exit(1)
  })
