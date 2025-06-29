import {honoFetch} from "@/lib/api/hono-client";
import {Income, IncomeUpdatePayload} from "@/types/income";
import {ExpenseUpdatePayload} from "@/types/expenses";

/**
 * API Client for income-related endpoints
 */
export const incomeApi = {
    getIncomes: async () => {
        return honoFetch<Array<Income>>('/api/income');
    },
    createIncome: async (data: IncomeUpdatePayload) => {
        return honoFetch<{ success: boolean }>(`/api/income`, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },
    deleteIncomeById: async (id: string) => {
        return honoFetch<{ success: boolean }>(`/api/income/${id}`, {
            method: 'DELETE',
        });
    },
    updateIncomeById: async (id: string, data: ExpenseUpdatePayload) => {
        return honoFetch<Income>(`/api/income/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    getIncomeById: async (id: string) => {
        return honoFetch<Income>(`/api/income/${id}`);
    },
};