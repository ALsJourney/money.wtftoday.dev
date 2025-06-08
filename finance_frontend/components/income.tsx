import {useAsyncData} from "@/hooks/useAsyncData";
import {Income} from "@/types/income";
import {incomeApi} from "@/lib/api/income";
import Link from "next/link";
import {useState} from "react";
import {formatAmount} from "@/utils/formatCurrency";

interface IncomeProps {
    id?: string;
}

export default function IncomeData({id}: IncomeProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const {data, loading, error, refetch} = useAsyncData<Income[]>(
        () => incomeApi.getIncomes(),
        [id]
    );

    const handleDelete = async (incomeId: string) => {
        if (!confirm('Are you sure you want to delete this income entry?')) return;

        setDeletingId(incomeId);
        try {
            await incomeApi.deleteIncomeById(incomeId);
            await refetch();
        } catch (error) {
            console.error('Failed to delete income:', error);
            alert('Failed to delete income. Please try again.');
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
                <span>Error loading income: {error.message}</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="stats">
                    <div className="stat">
                        <div className="stat-title">Total Entries</div>
                        <div className="stat-value text-sm">{data?.length || 0}</div>
                    </div>
                </div>
                <Link href="/add" className="btn btn-success btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Income
                </Link>
            </div>

            {/* Income List */}
            {data && data.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.map((income) => (
                        <div key={income.id}
                             className="card bg-base-50 border border-base-300 hover:shadow-md transition-shadow">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <Link href={`/details?id=${income.id}&type=income`}><h3
                                            className="font-semibold text-base-content">{income.customer}</h3></Link>
                                        <p className="text-2xl font-bold text-success">{formatAmount(parseFloat(income.amount))}</p>
                                        <p className="text-sm text-base-content/70 mt-1">{income.description}</p>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            className="btn btn-ghost btn-sm"
                                            href={`/edit?id=${income.id}&type=income`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                                 viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </Link>

                                        <button
                                            className={`btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content ${deletingId === income.id ? 'loading' : ''}`}
                                            onClick={() => handleDelete(income.id)}
                                            disabled={deletingId === income.id}
                                        >
                                            {deletingId === income.id ? null : (
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
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                    </div>
                    <p className="text-base-content/70 mb-4">No income entries found</p>
                    <Link href="/add" className="btn btn-success">
                        Add Your First Income
                    </Link>
                </div>
            )}
        </div>
    );
}