export type Income = {
    id: string;
    userId: string;
    invoiceDate: string;
    customer: string;
    description: string;
    paymentDate: string;
    amount: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    createdAt: string;
    updatedAt: string;
}

export type IncomeUpdatePayload = {
    invoiceDate: string;
    vendor: string;
    description: string;
    paymentDate: string;
    amount: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
}