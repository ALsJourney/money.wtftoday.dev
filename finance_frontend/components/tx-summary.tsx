import { useEffect, useState } from 'react';
import {FinanceSummary} from "@/types/finance-summary";
import {financeApi} from "@/lib/api/summary-requests";

export function useFinanceSummary(year: number) {
    const [data, setData] = useState<FinanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const summaryData = await financeApi.getSummary();
                setData(summaryData);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [year]);

    return { data, loading, error };
}