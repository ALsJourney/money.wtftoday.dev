import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isAuthenticated } from '../middleware/auth';
import db from '../db';
import { income } from '../db/finance-schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

export const incomeRouter = new Hono();

// Apply CORS
incomeRouter.use('*', cors({
  origin: (o) => allowedOrigins.includes(o!) ? o : undefined,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Create income record
incomeRouter.post('/', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.invoiceDate || !body.customer || !body.description || !body.amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const newIncome = await db.insert(income).values({
      userId,
      invoiceDate: new Date(body.invoiceDate),
      customer: body.customer,
      description: body.description,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      amount: body.amount,
      fileUrl: body.fileUrl || null,
      fileName: body.fileName || null,
      fileType: body.fileType || null,
    }).returning();
    
    return c.json(newIncome[0], 201);
  } catch (error) {
    console.error('Error creating income:', error);
    return c.json({ error: 'Failed to create income record' }, 500);
  }
});

// Get all income records for the authenticated user
incomeRouter.get('/', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');
    const year = c.req.query('year');
    
    let query = db.select().from(income).where(eq(income.userId, userId));
    
    // Filter by year if provided
    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      query = query.where(
        and(
          gte(income.invoiceDate, startDate),
          lte(income.invoiceDate, endDate)
        )
      );
    }
    
    // Order by invoice date descending
    const incomeRecords = await query.orderBy(income.invoiceDate);
    
    return c.json(incomeRecords);
  } catch (error) {
    console.error('Error fetching income records:', error);
    return c.json({ error: 'Failed to fetch income records' }, 500);
  }
});

// Get a specific income record
incomeRouter.get('/:id', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    
    const incomeRecord = await db.select().from(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .limit(1);
    
    if (incomeRecord.length === 0) {
      return c.json({ error: 'Income record not found' }, 404);
    }
    
    return c.json(incomeRecord[0]);
  } catch (error) {
    console.error('Error fetching income record:', error);
    return c.json({ error: 'Failed to fetch income record' }, 500);
  }
});

// Update an income record
incomeRouter.put('/:id', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Check if record exists and belongs to user
    const existingRecord = await db.select().from(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return c.json({ error: 'Income record not found' }, 404);
    }
    
    // Update the record
    const updatedIncome = await db.update(income)
      .set({
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        customer: body.customer,
        description: body.description,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        amount: body.amount,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileType: body.fileType,
        updatedAt: new Date(),
      })
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .returning();
    
    return c.json(updatedIncome[0]);
  } catch (error) {
    console.error('Error updating income record:', error);
    return c.json({ error: 'Failed to update income record' }, 500);
  }
});

// Delete an income record
incomeRouter.delete('/:id', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    
    // Check if record exists and belongs to user
    const existingRecord = await db.select().from(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .limit(1);
    
    if (existingRecord.length === 0) {
      return c.json({ error: 'Income record not found' }, 404);
    }
    
    // Delete the record
    await db.delete(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting income record:', error);
    return c.json({ error: 'Failed to delete income record' }, 500);
  }
});