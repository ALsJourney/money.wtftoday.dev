import {expenseApi} from "@/lib/api/expenses";
import {Expense} from "@/types/expenses";
import {useAsyncData} from "@/hooks/useAsyncData";
import Link from "next/link";
import {useState} from "react";

interface ExpensesProps {
    id?: string;
}

export default function Expenses({id}: ExpensesProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const {data, loading, error, refetch} = useAsyncData<Expense[]>(
        () => expenseApi.getExpenses(),
        [id]
    );

    const handleDelete = async (expenseId: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        setDeletingId(expenseId);
        try {
            // Assuming you have a delete method in expenseApi
            // await expenseApi.deleteExpense(expenseId);
            console.log('Delete expense:', expenseId);
            refetch(); // Refresh the data
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none"
                     viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Error loading expenses: {error.message}</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="stats">
                    <div className="stat">
                        <div className="stat-title">Total Expenses</div>
                        <div className="stat-value text-sm">{data?.length || 0}</div>
                    </div>
                </div>
                <Link href="/add" className="btn btn-primary btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Expense
                </Link>
            </div>

            {/* Expenses List */}
            {data && data.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.map((expense) => (
                        <div key={expense.id}
                             className="card bg-base-50 border border-base-300 hover:shadow-md transition-shadow">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base-content">{expense.vendor}</h3>
                                        <p className="text-2xl font-bold text-error">${expense.amount?.toLocaleString()}</p>
                                        <p className="text-sm text-base-content/70 mt-1">{expense.description}</p>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => {
                                                // Handle edit - you can implement this
                                                console.log('Edit expense:', expense.id);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                                 viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </button>

                                        <button
                                            className={`btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content ${deletingId === expense.id ? 'loading' : ''}`}
                                            onClick={() => handleDelete(expense.id)}
                                            disabled={deletingId === expense.id}
                                        >
                                            {deletingId === expense.id ? null : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-base-content/50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                    </div>
                    <p className="text-base-content/70 mb-4">No expenses found</p>
                    <Link href="/add" className="btn btn-primary">
                        Add Your First Expense
                    </Link>
                </div>
            )}
        </div>
    );
}