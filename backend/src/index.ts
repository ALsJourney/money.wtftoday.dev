import { Hono } from 'hono'
import 'dotenv/config'

import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'
import { incomeRouter } from './routes/income'
import { expenseRouter } from './routes/expense'
import { dashboardRouter } from './routes/dashboard'
import { uploadRouter } from './routes/upload'
import { cors } from 'hono/cors'


const app = new Hono()

app.use('*', cors({
    origin: (o) => process.env.ALLOWED_ORIGINS?.split(',')?.includes(o!) ? o : undefined,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST','GET','OPTIONS', 'PUT', 'DELETE'],
    credentials: true,
}))

app.route('/health', healthRouter)

app.route('/api/auth', authRouter)

app.route('/api/income', incomeRouter)
app.route('/api/expense', expenseRouter)
app.route('/api/dashboard', dashboardRouter)
app.route('/api/upload', uploadRouter)
app.route('/api/files', uploadRouter)

app.get('/', (c) =>
  c.json({
    message: 'Kleinunternehmer Finance Dashboard',
    links: [
      { text: 'Auth docs', href: new URL('/api/auth/reference', c.req.url).href },
      { text: 'Dashboard', href: new URL('/api/dashboard/summary/2025', c.req.url).href }
    ]
  })
)

export default {
  port: process.env.APP_PORT ?? 8558,
  host: process.env.APP_HOST,
  fetch: app.fetch,
}
