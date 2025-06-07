'use client';

import NavBar from "@/components/nav-bar";
import {useFinanceSummary} from "@/components/tx-summary";
import Expenses from "@/components/expenses";
import IncomeData from "@/components/income";

export default function DashboardPage() {
    const {data, loading, error} = useFinanceSummary(2025);

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200">
                <NavBar/>
                <div className="flex justify-center items-center h-96">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-base-200">
                <NavBar/>
                <div className="container mx-auto px-4 py-8">
                    <div className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6"
                             fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Error: {error.message}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (data) {
        const {totalIncome, totalExpenses, netIncome} = data;

        return (
            <div className="min-h-screen bg-base-200">
                <NavBar/>

                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-base-content mb-2">Finance Dashboard</h1>
                        <p className="text-base-content/70">Track your income and expenses for 2025</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div
                            className="card bg-gradient-to-br from-success to-success/80 text-success-content shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title text-lg">Total Income</h2>
                                <p className="text-3xl font-bold">${totalIncome?.toLocaleString() || '0'}</p>
                                <div className="card-actions justify-end">
                                    <div className="badge badge-success badge-outline">+Income</div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-gradient-to-br from-error to-error/80 text-error-content shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title text-lg">Total Expenses</h2>
                                <p className="text-3xl font-bold">${totalExpenses?.toLocaleString() || '0'}</p>
                                <div className="card-actions justify-end">
                                    <div className="badge badge-error badge-outline">-Expenses</div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`card bg-gradient-to-br ${netIncome >= 0 ? 'from-info to-info/80 text-info-content' : 'from-warning to-warning/80 text-warning-content'} shadow-xl`}>
                            <div className="card-body">
                                <h2 className="card-title text-lg">Net Income</h2>
                                <p className="text-3xl font-bold">${netIncome?.toLocaleString() || '0'}</p>
                                <div className="card-actions justify-end">
                                    <div
                                        className={`badge ${netIncome >= 0 ? 'badge-info' : 'badge-warning'} badge-outline`}>
                                        {netIncome >= 0 ? 'Profit' : 'Loss'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Expenses Section */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title text-2xl mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    Expenses
                                </h2>
                                <Expenses/>
                            </div>
                        </div>

                        {/* Income Section */}
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title text-2xl mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                    </svg>
                                    Income
                                </h2>
                                <IncomeData/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}