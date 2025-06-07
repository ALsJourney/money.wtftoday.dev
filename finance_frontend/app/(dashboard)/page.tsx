'use client';

import NavBar from "@/components/nav-bar";
import {useFinanceSummary} from "@/components/tx-summary";

export default function DashboardPage() {

    const { data, loading, error } = useFinanceSummary(2025);
    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }
    if (data) {
        const { totalIncome, totalExpenses, netIncome } = data;
        return (
            <>
                <NavBar />
                <div>
                    <h1>Dashboard</h1>
                    <p>Total income: {totalIncome}</p>
                    <p>Total expenses: {totalExpenses}</p>
                    <p>Net income: {netIncome}</p>
                </div>

                <div>
                    <h2>expenses</h2>

                </div>
            </>
        )
    }

}