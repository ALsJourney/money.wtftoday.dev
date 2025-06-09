import {useState, useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {incomeApi} from "@/lib/api/income";
import {expenseApi} from "@/lib/api/expenses";
import {Expense} from "@/types/expenses";
import {Income} from "@/types/income";
import Link from "next/link";
import {formatAmount} from "@/utils/formatCurrency";
import {formatDate} from "@/utils/formatDate";
import {downloadFile} from "@/utils/downloadFile";

type DetailType = 'income' | 'expense';

export default function DetailPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const type = searchParams.get('type') as DetailType;

    const [record, setRecord] = useState<Expense | Income | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchRecord = async () => {
            if (!id || !type) {
                setError('Missing ID or type parameter');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                let data;

                if (type === 'income') {
                    data = await incomeApi.getIncomeById(id);
                } else if (type === 'expense') {
                    data = await expenseApi.getExpenseById(id);
                } else {
                    throw new Error('Invalid type parameter');
                }

                setRecord(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching record:', err);
                setError('Failed to fetch record details');
            } finally {
                setLoading(false);
            }
        };

        fetchRecord();
    }, [id, type]);

    const handleDownload = async () => {
        if (!record?.fileUrl || !record?.fileName) {
            return;
        }

        setDownloading(true);
        try {
            // Convert view URL to download URL
            const downloadUrl = `${record.fileUrl}/download`;
            await downloadFile(downloadUrl, record.fileName);
        } catch (error) {
            console.error('Download failed:', error);
            // You might want to show a toast notification here
            alert('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error max-w-md mx-auto mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
                     viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{error}</span>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="alert alert-warning max-w-md mx-auto mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
                     viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span>Record not found</span>
            </div>
        );
    }

    const isIncome = type === 'income';
    const recordData = record as Expense | Income;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold">
                            {isIncome ? 'Income' : 'Expense'} Details
                        </h1>
                        <div className={`badge badge-lg ${isIncome ? 'badge-success' : 'badge-error'}`}>
                            {isIncome ? 'Income' : 'Expense'}
                        </div>
                    </div>

                    {/* Main Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Amount */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Amount</span>
                            </label>
                            <div className={`text-2xl font-bold ${isIncome ? 'text-success' : 'text-error'}`}>
                                {formatAmount(parseFloat(recordData.amount))}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    {isIncome ? 'Invoice Date' : 'Date'}
                                </span>
                            </label>
                            <div className="text-lg">
                                {formatDate(isIncome ? recordData.invoiceDate : recordData.createdAt)}
                            </div>
                        </div>

                        {/* Customer/Vendor */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    {isIncome ? 'Customer' : 'Vendor'}
                                </span>
                            </label>
                            <div className="text-lg">
                                {(isIncome
                                        ? (recordData as Income).customer
                                        : (recordData as Expense).vendor
                                ) || 'Not specified'}
                            </div>
                        </div>

                        {/* Payment Date (for income) */}
                        {isIncome && recordData.paymentDate && (
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Payment Date</span>
                                </label>
                                <div className="text-lg">
                                    {formatDate(recordData.paymentDate)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="form-control mt-6">
                        <label className="label">
                            <span className="label-text font-semibold">Description</span>
                        </label>
                        <div className="textarea textarea-bordered min-h-24 bg-base-200 cursor-default">
                            {recordData.description || 'No description provided'}
                        </div>
                    </div>

                    {/* File Information */}
                    {recordData.fileUrl && (
                        <div className="form-control mt-6">
                            <label className="label">
                                <span className="label-text font-semibold">Attached File</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="text-lg">{recordData.fileName}</div>
                                    <div className="text-sm text-gray-500">{recordData.fileType}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={recordData.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline btn-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                        View File (encrypted)
                                    </Link>
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className={`btn btn-primary btn-sm ${downloading ? 'loading' : ''}`}
                                    >
                                        {!downloading && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                                 viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        )}
                                        {downloading ? 'Downloading...' : 'Download'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="divider mt-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                            <span className="font-semibold">Record ID:</span> {recordData.id}
                        </div>
                        {recordData.createdAt && (
                            <div>
                                <span className="font-semibold">Created:</span> {formatDate(recordData.createdAt)}
                            </div>
                        )}
                        {recordData.updatedAt && (
                            <div>
                                <span className="font-semibold">Last Updated:</span> {formatDate(recordData.updatedAt)}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="card-actions justify-end mt-8">
                        <button
                            className="btn btn-outline"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}