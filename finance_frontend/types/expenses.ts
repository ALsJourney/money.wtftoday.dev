export type ExpenseUpdatePayload = {
    invoiceDate: string;
    vendor?: string;
    description: string;
    paymentDate?: string;
    amount?: number;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
};

export type Expense = {
    id: string;
    userId: string;
    invoiceDate: string;
    vendor: string;
    description: string;
    paymentDate: string;
    amount: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    createdAt: string;
    updatedAt: string;
}