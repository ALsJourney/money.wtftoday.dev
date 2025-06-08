import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {auth} from '../auth';
import db from '../db';
import {income, expense} from '../db/finance-schema';
import {eq, and, gte, lte, sql, sum} from 'drizzle-orm';
import {parse} from "dotenv";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

export const dashboardRouter = new Hono();

// Apply CORS
dashboardRouter.use('*', cors({
    origin: (o) => allowedOrigins.includes(o!) ? o : undefined,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'OPTIONS'],
    credentials: true,
}));

// Middleware to check if user is authenticated
const isAuthenticated = async (c, next) => {
    try {
        // Use Better Auth's session API through the server handler
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) {
            return c.json({error: 'Unauthorized'}, 401);
        }

        c.set('userId', session.user.id);
        await next();
    } catch (error) {
        console.error('Authentication error:', error);
        return c.json({error: 'Unauthorized'}, 401);
    }
};

// Get yearly summary (total income, total expenses, net income)
dashboardRouter.get('/summary/:year', isAuthenticated, async (c) => {
    try {
        const userId = c.get('userId');
        const year = c.req.param('year') || '2025'; // Default to 2025 as specified in requirements

        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

        // Get total income for the year
        const totalIncomeResult = await db
            .select({total: sum(income.amount)})
            .from(income)
            .where(
                and(
                    eq(income.userId, userId),
                    gte(income.invoiceDate, startDate),
                    lte(income.invoiceDate, endDate)
                )
            );

        // Get total expenses for the year
        const totalExpensesResult = await db
            .select({total: sum(expense.amount)})
            .from(expense)
            .where(
                and(
                    eq(expense.userId, userId),
                    gte(expense.invoiceDate, startDate),
                    lte(expense.invoiceDate, endDate)
                )
            );

        const totalIncome = parseInt(totalIncomeResult[0].total) || 0;
        const totalExpenses = parseInt(totalExpensesResult[0].total) || 0;
        const netIncome = totalIncome - totalExpenses;

        return c.json({
            year,
            totalIncome,
            totalExpenses,
            netIncome
        });
    } catch (error) {
        console.error('Error fetching yearly summary:', error);
        return c.json({error: 'Failed to fetch yearly summary'}, 500);
    }
});

// Get monthly breakdown for a specific year
dashboardRouter.get('/monthly/:year', isAuthenticated, async (c) => {
    try {
        const userId = c.get('userId');
        const year = c.req.param('year') || '2025'; // Default to 2025 as specified in requirements

        // Get monthly income
        const monthlyIncome = await db
            .select({
                month: sql`EXTRACT(MONTH FROM
                ${income.invoiceDate}
                )
                :
                :
                integer`,
                total: sum(income.amount)
            })
            .from(income)
            .where(
                and(
                    eq(income.userId, userId),
                    sql`EXTRACT(YEAR FROM
                    ${income.invoiceDate}
                    )
                    =
                    ${year}`
                )
            )
            .groupBy(sql`EXTRACT(MONTH FROM
            ${income.invoiceDate}
            )`)
            .orderBy(sql`EXTRACT(MONTH FROM
            ${income.invoiceDate}
            )`);

        // Get monthly expenses
        const monthlyExpenses = await db
            .select({
                month: sql`EXTRACT(MONTH FROM
                ${expense.invoiceDate}
                )
                :
                :
                integer`,
                total: sum(expense.amount)
            })
            .from(expense)
            .where(
                and(
                    eq(expense.userId, userId),
                    sql`EXTRACT(YEAR FROM
                    ${expense.invoiceDate}
                    )
                    =
                    ${year}`
                )
            )
            .groupBy(sql`EXTRACT(MONTH FROM
            ${expense.invoiceDate}
            )`)
            .orderBy(sql`EXTRACT(MONTH FROM
            ${expense.invoiceDate}
            )`);

        // Create a complete monthly breakdown with all months
        const months = Array.from({length: 12}, (_, i) => i + 1);
        const monthlyBreakdown = months.map(month => {
            const incomeForMonth = monthlyIncome.find(item => item.month === month);
            const expensesForMonth = monthlyExpenses.find(item => item.month === month);

            const incomeTotal = incomeForMonth ? incomeForMonth.total : 0;
            const expensesTotal = expensesForMonth ? expensesForMonth.total : 0;

            return {
                month,
                income: incomeTotal,
                expenses: expensesTotal,
                net: incomeTotal - expensesTotal
            };
        });

        return c.json({
            year,
            monthlyBreakdown
        });
    } catch (error) {
        console.error('Error fetching monthly breakdown:', error);
        return c.json({error: 'Failed to fetch monthly breakdown'}, 500);
    }
});

// Get recent transactions (both income and expenses)
dashboardRouter.get('/recent', isAuthenticated, async (c) => {
    try {
        const userId = c.get('userId');
        const limit = parseInt(c.req.query('limit') || '5');

        // Get recent income
        const recentIncome = await db
            .select({
                id: income.id,
                type: sql`'income'::text`,
                date: income.invoiceDate,
                description: income.description,
                amount: income.amount,
                customer: income.customer,
                vendor: sql`null::text`
            })
            .from(income)
            .where(eq(income.userId, userId))
            .orderBy(income.invoiceDate, 'desc')
            .limit(limit);

        // Get recent expenses
        const recentExpenses = await db
            .select({
                id: expense.id,
                type: sql`'expense'::text`,
                date: expense.invoiceDate,
                description: expense.description,
                amount: expense.amount,
                customer: sql`null::text`,
                vendor: expense.vendor
            })
            .from(expense)
            .where(eq(expense.userId, userId))
            .orderBy(expense.invoiceDate, 'desc')
            .limit(limit);

        // Combine and sort by date
        const recentTransactions = [...recentIncome, ...recentExpenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);

        return c.json(recentTransactions);
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        return c.json({error: 'Failed to fetch recent transactions'}, 500);
    }
});