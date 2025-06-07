import {FinanceSummary} from "@/types/finance-summary";
import {financeApi} from "@/lib/api/summary-requests";
import {useAsyncData} from "@/hooks/useAsyncData";

export function useFinanceSummary(year: number) {

    const {data, loading, error} = useAsyncData<FinanceSummary>(
        () => financeApi.getSummary(), [year]
    );

    return {data, loading, error};
}