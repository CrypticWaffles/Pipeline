import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { pool } from './db.js'

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_id) DO UPDATE
           SET email = EXCLUDED.email, name = EXCLUDED.name, avatar = EXCLUDED.avatar
         RETURNING *`,
        [
          profile.id,
          profile.emails?.[0]?.value ?? null,
          profile.displayName ?? null,
          profile.photos?.[0]?.value ?? null,
        ]
      )
      done(null, rows[0])
    } catch (err) {
      done(err)
    }
  }
))

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    done(null, rows[0] ?? false)
  } catch (err) {
    done(err)
  }
})

export default passport
