import {honoFetch} from "@/lib/api/hono-client";
import {Expense, ExpenseUpdatePayload} from "@/types/expenses";

/**
 * API client for expense-related endpoints
 */
export const expenseApi = {
    createExpense: async (data: ExpenseUpdatePayload) => {
        return honoFetch<{ success: boolean }>(`/api/expense`, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },
    getExpenses: async () => {
        return honoFetch<Array<Expense>>('/api/expense');
    },
    getExpenseById: async (id: string) => {
        return honoFetch<Expense>(`/api/expense/${id}`);
    },
    updateExpenseById: async (id: string, data: {
        invoiceDate: string;
        vendor: string;
        description: string;
        paymentDate: string | undefined;
        amount: string | undefined;
        fileUrl: string | undefined;
        fileName: string | undefined;
        fileType: string | undefined
    }) => {
        return honoFetch<Expense>(`/api/expense/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    deleteExpenseById: async (id: string) => {
        return honoFetch<{ success: boolean }>(`/api/expense/${id}`, {
            method: 'DELETE',
        });
    },
};