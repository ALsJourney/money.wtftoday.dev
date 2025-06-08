import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import db from "../db";
import { expense } from "../db/finance-schema";
import { isAuthenticated } from "../middleware/auth";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

export const expenseRouter = new Hono();

// Apply CORS
expenseRouter.use(
	"*",
	cors({
		origin: (o) => (allowedOrigins.includes(o!) ? o : undefined),
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);

// Create expense record
expenseRouter.post("/", isAuthenticated, async (c) => {
	try {
		const userId = c.get("userId");
		const body = await c.req.json();

		// Validate required fields
		if (
			!body.invoiceDate ||
			!body.vendor ||
			!body.description ||
			!body.amount
		) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		const newExpense = await db
			.insert(expense)
			.values({
				userId,
				invoiceDate: new Date(body.invoiceDate),
				vendor: body.vendor,
				description: body.description,
				paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
				amount: body.amount,
				fileUrl: body.fileUrl || null,
				fileName: body.fileName || null,
				fileType: body.fileType || null,
			})
			.returning();

		return c.json(newExpense[0], 201);
	} catch (error) {
		console.error("Error creating expense:", error);
		return c.json({ error: "Failed to create expense record" }, 500);
	}
});

// Get all expense records for the authenticated user
expenseRouter.get("/", isAuthenticated, async (c) => {
	try {
		const userId = c.get("userId");
		const year = c.req.query("year");

		const conditions = [eq(expense.userId, userId)];

		if (year) {
			const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
			const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
			conditions.push(gte(expense.invoiceDate, startDate));
			conditions.push(lte(expense.invoiceDate, endDate));
		}

		const query = db
			.select()
			.from(expense)
			.where(and(...conditions));

		const expenseRecords = await query.orderBy(expense.invoiceDate);

		return c.json(expenseRecords);
	} catch (error) {
		console.error("Error fetching expense records:", error);
		return c.json({ error: "Failed to fetch expense records" }, 500);
	}
});

// Get a specific expense record
expenseRouter.get("/:id", isAuthenticated, async (c) => {
	try {
		const userId = c.get("userId");
		const id = c.req.param("id");

		const expenseRecord = await db
			.select()
			.from(expense)
			.where(and(eq(expense.id, id), eq(expense.userId, userId)))
			.limit(1);

		if (expenseRecord.length === 0) {
			return c.json({ error: "Expense record not found" }, 404);
		}

		return c.json(expenseRecord[0]);
	} catch (error) {
		console.error("Error fetching expense record:", error);
		return c.json({ error: "Failed to fetch expense record" }, 500);
	}
});

// Update an expense record
expenseRouter.put("/:id", isAuthenticated, async (c) => {
	try {
		const userId = c.get("userId");
		const id = c.req.param("id");
		const body = await c.req.json();

		// Check if record exists and belongs to user
		const existingRecord = await db
			.select()
			.from(expense)
			.where(and(eq(expense.id, id), eq(expense.userId, userId)))
			.limit(1);

		if (existingRecord.length === 0) {
			return c.json({ error: "Expense record not found" }, 404);
		}

		// Update the record
		const updatedExpense = await db
			.update(expense)
			.set({
				invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
				vendor: body.vendor,
				description: body.description,
				paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
				amount: body.amount,
				fileUrl: body.fileUrl,
				fileName: body.fileName,
				fileType: body.fileType,
				updatedAt: new Date(),
			})
			.where(and(eq(expense.id, id), eq(expense.userId, userId)))
			.returning();

		return c.json(updatedExpense[0]);
	} catch (error) {
		console.error("Error updating expense record:", error);
		return c.json({ error: "Failed to update expense record" }, 500);
	}
});

// Delete an expense record
expenseRouter.delete("/:id", isAuthenticated, async (c) => {
	try {
		const userId = c.get("userId");
		const id = c.req.param("id");

		// Check if record exists and belongs to user
		const existingRecord = await db
			.select()
			.from(expense)
			.where(and(eq(expense.id, id), eq(expense.userId, userId)))
			.limit(1);

		if (existingRecord.length === 0) {
			return c.json({ error: "Expense record not found" }, 404);
		}

		// Delete the record
		await db
			.delete(expense)
			.where(and(eq(expense.id, id), eq(expense.userId, userId)));

		return c.json({ success: true });
	} catch (error) {
		console.error("Error deleting expense record:", error);
		return c.json({ error: "Failed to delete expense record" }, 500);
	}
});
