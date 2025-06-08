import {useSearchParams, useRouter} from 'next/navigation';
import {incomeApi} from '@/lib/api/income';
import {expenseApi} from '@/lib/api/expenses';
import {uploadApi} from '@/lib/api/uploads';
import {formatDateForInput} from "@/utils/formatDate";
import {ExpenseUpdatePayload} from "@/types/expenses";
import {useState, useEffect} from "react";

type EditType = 'income' | 'expense';

interface FormData {
    invoiceDate: string;
    customer?: string;
    vendor?: string;
    description: string;
    paymentDate?: string;
    amount: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
}


export default function EditPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const id = searchParams.get('id');
    const type = searchParams.get('type') as EditType;

    const [formData, setFormData] = useState<FormData>({
        invoiceDate: '',
        customer: '',
        vendor: '',
        description: '',
        paymentDate: '',
        amount: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
    });

    const [newFile, setNewFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Load existing data
    useEffect(() => {
        const loadData = async () => {
            if (!id || !type) {
                setError('Missing ID or type parameter');
                setLoadingData(false);
                return;
            }

            try {
                let data;
                if (type === 'income') {
                    data = await incomeApi.getIncomeById(id);
                    setFormData({
                        invoiceDate: formatDateForInput(data.invoiceDate),
                        customer: data.customer || '',
                        vendor: '',                   // vendor does not exist for income, pass empty string
                        description: data.description,
                        paymentDate: formatDateForInput(data.paymentDate) || '',
                        amount: data.amount.toString(),
                        fileUrl: data.fileUrl || '',
                        fileName: data.fileName || '',
                        fileType: data.fileType || '',
                    });
                } else if (type === 'expense') {
                    data = await expenseApi.getExpenseById(id);
                    setFormData({
                        invoiceDate: formatDateForInput(data.invoiceDate),
                        customer: '',                 // customer does not exist for expense, pass empty string
                        vendor: data.vendor || '',
                        description: data.description,
                        paymentDate: formatDateForInput(data.paymentDate) || '',
                        amount: data.amount.toString(),
                        fileUrl: data.fileUrl || '',
                        fileName: data.fileName || '',
                        fileType: data.fileType || '',
                    });
                } else {
                    setError('Invalid type parameter');
                    setLoadingData(false);
                    return;
                }

            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load record data');
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [id, type]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setNewFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFormData(prev => ({
            ...prev,
            fileUrl: '',
            fileName: '',
            fileType: '',
        }));
        setNewFile(null);
    };

    const validateForm = (): boolean => {
        setError(null);

        if (!formData.invoiceDate) {
            setError('Invoice date is required');
            return false;
        }

        if (type === 'income' && !formData.customer) {
            setError('Customer is required for income');
            return false;
        }

        if (type === 'expense' && !formData.vendor) {
            setError('Vendor is required for expense');
            return false;
        }

        if (!formData.description) {
            setError('Description is required');
            return false;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Valid amount is required');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !id) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let fileUrl = formData.fileUrl || '';
            let fileName = formData.fileName || '';
            let fileType = formData.fileType || '';

            // Upload new file if provided
            if (newFile) {
                try {
                    const uploadResult = await uploadApi.uploadFile(newFile);
                    fileUrl = uploadResult.fileUrl;
                    fileName = uploadResult.fileName;
                    fileType = uploadResult.fileType;
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    setError('File upload failed. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            // Prepare data for API
            const apiData = {
                invoiceDate: formData.invoiceDate,
                vendor: formData.vendor || undefined,
                description: formData.description,
                paymentDate: formData.paymentDate || undefined,
                amount: formData.amount || undefined,
                fileUrl: fileUrl || undefined,
                fileName: fileName || undefined,
                fileType: fileType || undefined,
            };

            // Update based on type
            if (type === 'income') {
                const incomeData = {
                    ...apiData,
                    customer: formData.customer!,
                };
                await incomeApi.updateIncomeById(id, incomeData as ExpenseUpdatePayload);
            } else {
                const expenseData = {
                    ...apiData,
                    vendor: formData.vendor!,
                };
                await expenseApi.updateExpenseById(id, expenseData);
            }

            setSuccess(true);

            // Redirect after successful update
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err) {
            console.error('Error updating record:', err);
            setError(err instanceof Error ? err.message : 'Failed to update record');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !window.confirm(`Are you sure you want to delete this ${type}?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (type === 'income') {
                await incomeApi.deleteIncomeById(id);
            } else {
                await expenseApi.deleteExpenseById(id);
            }

            // Redirect after successful deletion
            router.push('/');

        } catch (err) {
            console.error('Error deleting record:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete record');
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!id || !type) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="text-red-500">Error: Missing ID or type parameter</div>
                <button
                    onClick={() => router.push('/')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }
    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                    Edit {type === 'income' ? 'Income' : 'Expense'}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                    {type === 'income' ? 'Income' : 'Expense'} record updated successfully! Redirecting...
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Invoice Date */}
                <div>
                    <label htmlFor="invoiceDate" className="block text-sm font-medium mb-1">
                        Invoice Date *
                    </label>
                    <input
                        type="date"
                        id="invoiceDate"
                        name="invoiceDate"
                        value={formData.invoiceDate}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Customer (for income) or Vendor (for expense) */}
                <div>
                    <label htmlFor={type === 'income' ? 'customer' : 'vendor'}
                           className="block text-sm font-medium mb-1">
                        {type === 'income' ? 'Customer' : 'Vendor'} *
                    </label>
                    <input
                        type="text"
                        id={type === 'income' ? 'customer' : 'vendor'}
                        name={type === 'income' ? 'customer' : 'vendor'}
                        value={type === 'income' ? formData.customer || '' : formData.vendor || ''}
                        onChange={handleInputChange}
                        required
                        placeholder={`Enter ${type === 'income' ? 'customer' : 'vendor'} name`}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        placeholder="Enter description"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Amount */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium mb-1">
                        Amount * (€)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Payment Date */}
                <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium mb-1">
                        Payment Date
                    </label>
                    <input
                        type="date"
                        id="paymentDate"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* File Management */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Attached Document
                    </label>

                    {/* Current file */}
                    {formData.fileName && !newFile && (
                        <div className="mb-2 p-2 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Current: {formData.fileName}
                                </span>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New file upload */}
                    <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {newFile && (
                        <p className="text-sm text-gray-600 mt-1">
                            New file: {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 rounded text-white font-medium ${
                            loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {loading ? 'Updating...' : `Update ${type === 'income' ? 'Income' : 'Expense'}`}
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className={`px-6 py-2 rounded text-white font-medium ${
                            loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                        {loading ? 'Processing...' : 'Delete'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        disabled={loading}
                        className="px-6 py-2 rounded bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}