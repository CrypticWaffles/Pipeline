import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-jwt-secret'

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, avatar: user.avatar },
    SECRET,
    { expiresIn: '7d' }
  )
}

export function jwtMiddleware(req, _res, next) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), SECRET)
      req.user = { id: payload.sub, email: payload.email, name: payload.name, avatar: payload.avatar }
    } catch {
      // invalid/expired token — req.user stays undefined
    }
  }
  next()
}
