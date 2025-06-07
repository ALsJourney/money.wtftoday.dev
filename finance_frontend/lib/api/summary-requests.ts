import {honoFetch} from "@/lib/api/hono-client";


/**
 * API client for finance-related endpoints
 */
export const financeApi = {
    getSummary: async () => {
        return honoFetch<{
            totalIncome: number;
            totalExpenses: number;
            netIncome: number;
        }>('/api/dashboard/summary/2025');
    },

    getTransactions: async (params: {
        year?: number;
        month?: number;
        page?: number;
        limit?: number;
    }) => {
        return honoFetch<{
            transactions: Array<{
                id: string;
                amount: number;
                description: string;
                date: string;
                type: 'income' | 'expense';
            }>;
            pagination: {
                total: number;
                page: number;
                limit: number;
            };
        }>('/api/finance/transactions', {
            params,
        });
    },

};
