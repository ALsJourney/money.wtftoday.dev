import { Hono } from 'hono'
import 'dotenv/config'

import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'
import { incomeRouter } from './routes/income'
import { expenseRouter } from './routes/expense'
import { dashboardRouter } from './routes/dashboard'
import { uploadRouter } from './routes/upload'

const app = new Hono()

// mount your health-check router at /health
app.route('/health', healthRouter)

// mount the auth router at /api/auth
app.route('/api/auth', authRouter)

// mount finance routes
app.route('/api/income', incomeRouter)
app.route('/api/expense', expenseRouter)
app.route('/api/dashboard', dashboardRouter)
app.route('/api/upload', uploadRouter)
app.route('/api/files', uploadRouter)

// your existing root route
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
