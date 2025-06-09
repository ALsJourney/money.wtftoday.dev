import {Hono} from 'hono';
import {eq, and, gte, lte, sql} from 'drizzle-orm';
import db from '../db';
import {PDFGenerator, FinanceEntry} from '../utils/pdfGenerator';
import {isAuthenticated} from "../middleware/auth";
import {expense, income} from "../db/finance-schema";

const exportRouter = new Hono();

exportRouter.use('*', isAuthenticated);

exportRouter.get('/tax-report/:year', async (c) => {
    try {
        const userId = c.get('userId') as string;
        const year = parseInt(c.req.param('year'));

        if (!userId) {
            return c.json({error: 'Unauthorized'}, 401);
        }

        // Create date range for the year
        const startDate = new Date(year, 0, 1); // January 1st
        const endDate = new Date(year + 1, 0, 1); // January 1st of next year

        // Fetch all income and expense data for the year
        const [incomeData, expenseData] = await Promise.all([
            db.select()
                .from(income)
                .where(
                    and(
                        eq(income.userId, userId),
                        gte(income.invoiceDate, startDate),
                        lte(income.invoiceDate, endDate)
                    )
                ),
            db.select()
                .from(expense)
                .where(
                    and(
                        eq(expense.userId, userId),
                        gte(expense.invoiceDate, startDate),
                        lte(expense.invoiceDate, endDate)
                    )
                )
        ]);

        // Transform data to FinanceEntry format
        const entries: FinanceEntry[] = [
            ...incomeData.map(item => ({
                id: item.id.toString(),
                description: item.description || '',
                amount: parseFloat(item.amount.toString()),
                date: item.invoiceDate?.toISOString() || new Date().toISOString(),
                category: item.customer || 'Income', // Using customer as category fallback
                attachment: item.fileUrl || undefined,
                type: 'income' as const
            })),
            ...expenseData.map(item => ({
                id: item.id.toString(),
                description: item.description || '',
                amount: parseFloat(item.amount.toString()),
                date: item.invoiceDate?.toISOString() || new Date().toISOString(),
                category: item.vendor || 'Expense', // Using vendor as category fallback
                attachment: item.fileUrl || undefined,
                type: 'expense' as const
            }))
        ];

        // Generate PDF report
        const reportPdf = await PDFGenerator.generateFinanceReport(entries, year, userId);

        // Create ZIP with attachments
        const zipBuffer = await PDFGenerator.createZipWithAttachments(entries, userId, reportPdf);

        // Set headers for download
        c.header('Content-Type', 'application/zip');
        c.header('Content-Disposition', `attachment; filename="Einkommenssteuer_${year}_Komplett.zip"`);

        return c.body(zipBuffer);
    } catch (error) {
        console.error('Export error:', error);
        return c.json({error: 'Failed to generate export'}, 500);
    }
});

export {exportRouter};