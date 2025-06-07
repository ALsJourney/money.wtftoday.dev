'use client';

import {useState} from 'react';
import {incomeApi} from '@/lib/api/income';
import {expenseApi} from '@/lib/api/expenses';
import {uploadApi} from '@/lib/api/uploads';

type FormType = 'income' | 'expense';

interface FormData {
    invoiceDate: string;
    customer?: string;
    vendor?: string;
    description: string;
    paymentDate: string;
    amount: string;
    file?: File;
}

export default function AddData() {
    const [formType, setFormType] = useState<FormType>('income');
    const [formData, setFormData] = useState<FormData>({
        invoiceDate: '',
        customer: '',
        vendor: '',
        description: '',
        paymentDate: '',
        amount: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
            setFile(selectedFile);
        }
    };

    const resetForm = () => {
        setFormData({
            invoiceDate: '',
            customer: '',
            vendor: '',
            description: '',
            paymentDate: '',
            amount: '',
        });
        setFile(null);
        setError(null);
        setSuccess(false);
    };

    const validateForm = (): boolean => {
        setError(null);

        if (!formData.invoiceDate) {
            setError('Invoice date is required');
            return false;
        }

        if (formType === 'income' && !formData.customer) {
            setError('Customer is required for income');
            return false;
        }

        if (formType === 'expense' && !formData.vendor) {
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

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let fileUrl = '';
            let fileName = '';
            let fileType = '';

            // Upload file if provided
            if (file) {
                try {
                    const uploadResult = await uploadApi.uploadFile(file);
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
                description: formData.description,
                paymentDate: formData.paymentDate || undefined,
                amount: formData.amount,
                fileUrl: fileUrl || undefined,
                fileName: fileName || undefined,
                fileType: fileType || undefined,
            };

            // Submit based on form type
            if (formType === 'income') {
                const incomeData = {
                    ...apiData,
                    customer: formData.customer!,
                };
                await incomeApi.createIncome(incomeData as any);
            } else {
                const expenseData = {
                    ...apiData,
                    vendor: formData.vendor!,
                };
                await expenseApi.createExpense(expenseData);
            }

            setSuccess(true);
            resetForm();

            // Redirect after successful creation
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (err) {
            console.error('Error creating record:', err);
            setError(err instanceof Error ? err.message : 'Failed to create record');
        } finally {
            setLoading(false);
        }
    };

    const handleFormTypeChange = (type: FormType) => {
        setFormType(type);
        resetForm();
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Add New Financial Record</h1>

            {/* Form Type Selector */}
            <div className="mb-6">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleFormTypeChange('income')}
                        className={`px-4 py-2 rounded ${
                            formType === 'income'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFormTypeChange('expense')}
                        className={`px-4 py-2 rounded ${
                            formType === 'expense'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Expense
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                    {formType === 'income' ? 'Income' : 'Expense'} record created successfully! Redirecting...
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
                    <label htmlFor={formType === 'income' ? 'customer' : 'vendor'}
                           className="block text-sm font-medium mb-1">
                        {formType === 'income' ? 'Customer' : 'Vendor'} *
                    </label>
                    <input
                        type="text"
                        id={formType === 'income' ? 'customer' : 'vendor'}
                        name={formType === 'income' ? 'customer' : 'vendor'}
                        value={formType === 'income' ? formData.customer || '' : formData.vendor || ''}
                        onChange={handleInputChange}
                        required
                        placeholder={`Enter ${formType === 'income' ? 'customer' : 'vendor'} name`}
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

                {/* File Upload */}
                <div>
                    <label htmlFor="file" className="block text-sm font-medium mb-1">
                        Attach Document (Optional)
                    </label>
                    <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {file && (
                        <p className="text-sm text-gray-600 mt-1">
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
                        {loading ? 'Creating...' : `Create ${formType === 'income' ? 'Income' : 'Expense'}`}
                    </button>

                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="px-6 py-2 rounded bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 disabled:opacity-50"
                    >
                        Reset
                    </button>

                    <button
                        type="button"
                        onClick={() => window.location.href = '/'}
                        disabled={loading}
                        className="px-6 py-2 rounded bg-gray-500 text-white font-medium hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}