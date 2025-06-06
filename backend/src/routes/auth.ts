import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth, configuredProviders } from '../auth'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

export const authRouter = new Hono()

// apply CORS only on these sub-routes
authRouter.use('*', cors({
    origin: (o) => allowedOrigins.includes(o!) ? o : undefined,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST','GET','OPTIONS'],
    credentials: true,
}))

// list all providers
authRouter.get('/providers', (c) => {
    return c.json(Object.keys(configuredProviders))
})

// delegate all /api/auth/* traffic to better-auth handler
authRouter.all('*', (c) => {
    return auth.handler(c.req.raw)
})