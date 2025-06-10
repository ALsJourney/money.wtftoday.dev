import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import archiver from 'archiver';
import {promises as fs} from 'fs';
import * as path from 'path';
import {decryptBuffer, decodeEncryptionResult} from './crypto';

export interface FinanceEntry {
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
    attachment?: string;
    type: 'income' | 'expense';
}

export class PDFGenerator {
    static async generateFinanceReport(
        entries: FinanceEntry[],
        year: number,
        userId: string
    ): Promise<Buffer> {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text(`Einkommenssteuer Übersicht ${year}`, 20, 20);

        // Summary section
        const income = entries.filter(e => e.type === 'income');
        const expenses = entries.filter(e => e.type === 'expense');
        const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalIncome - totalExpenses;

        doc.setFontSize(14);
        doc.text('Zusammenfassung:', 20, 35);
        doc.setFontSize(11);
        doc.text(`Gesamteinkommen: ${totalIncome.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`, 20, 45);
        doc.text(`Gesamtausgaben: ${totalExpenses.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`, 20, 52);
        doc.text(`Nettoeinkommen: ${netIncome.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`, 20, 59);

        // Income table
        if (income.length > 0) {
            doc.setFontSize(14);
            doc.text('Einkommen:', 20, 75);

            autoTable(doc, {
                startY: 80,
                head: [['Datum', 'Beschreibung', 'Kategorie', 'Betrag (€)', 'Anhang']],
                body: income.map(entry => [
                    new Date(entry.date).toLocaleDateString('de-DE'),
                    entry.description,
                    entry.category || '-',
                    entry.amount.toLocaleString('de-DE', {minimumFractionDigits: 2}),
                    entry.attachment ? 'Ja' : 'Nein'
                ]),
                styles: {fontSize: 8},
                headStyles: {fillColor: [34, 197, 94]}
            });
        }

        // Expenses table
        if (expenses.length > 0) {
            const finalY = (doc as any).lastAutoTable?.finalY || 110;
            doc.setFontSize(14);
            doc.text('Ausgaben:', 20, finalY + 15);

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Datum', 'Beschreibung', 'Kategorie', 'Betrag (€)', 'Anhang']],
                body: expenses.map(entry => [
                    new Date(entry.date).toLocaleDateString('de-DE'),
                    entry.description,
                    entry.category || '-',
                    entry.amount.toLocaleString('de-DE', {minimumFractionDigits: 2}),
                    entry.attachment ? 'Ja' : 'Nein'
                ]),
                styles: {fontSize: 8},
                headStyles: {fillColor: [239, 68, 68]}
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Generiert am ${new Date().toLocaleDateString('de-DE')} - Seite ${i} von ${pageCount}`,
                20,
                doc.internal.pageSize.height - 10
            );
        }

        return Buffer.from(doc.output('arraybuffer'));
    }

    static async createZipWithAttachments(
        entries: FinanceEntry[],
        userId: string,
        reportPdf: Buffer
    ): Promise<Buffer> {
        const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD || "default-password-change-me";

        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {zlib: {level: 9}});
            const chunks: Buffer[] = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);

            // Add the main report
            archive.append(reportPdf, {name: 'Einkommenssteuer_Übersicht.pdf'});

            // Add all attachments
            const attachmentPromises = entries
                .filter(entry => entry.attachment)
                .map(async (entry, index) => {
                    try {
                        const uploadsDir = path.join(process.cwd(), 'uploads', userId);

                        // Extract filename from attachment path
                        // Handle cases like: "/api/files/userId/filename" or just "filename"
                        let fileName = entry.attachment!;
                        if (fileName.includes('/')) {
                            fileName = fileName.split('/').pop()!;
                        }

                        // Handle both encrypted and regular filenames
                        let filePath = path.join(uploadsDir, fileName);

                        // If the attachment doesn't include .encrypted, try adding it
                        if (!fileName.endsWith('.encrypted')) {
                            const encryptedPath = path.join(uploadsDir, `${fileName}.encrypted`);
                            try {
                                await fs.access(encryptedPath);
                                filePath = encryptedPath;
                                fileName = `${fileName}.encrypted`;
                            } catch {
                                // If encrypted version doesn't exist, use original path
                            }
                        }

                        // Check if file exists
                        await fs.access(filePath);

                        let fileBuffer: Buffer;
                        let originalName = fileName;

                        // If it's an encrypted file, decrypt it
                        if (filePath.endsWith('.encrypted')) {
                            try {
                                // Read the encrypted file
                                const encryptedBuffer = await fs.readFile(filePath);

                                // Read the metadata to get original filename
                                const metaPath = `${filePath}.meta`;
                                try {
                                    const metaContent = await fs.readFile(metaPath, 'utf8');
                                    const metadata = JSON.parse(metaContent);
                                    originalName = metadata.originalName || originalName.replace('.encrypted', '');
                                } catch {
                                    // If meta file doesn't exist, try to derive name
                                    originalName = originalName.replace('.encrypted', '');
                                }

                                // Decode and decrypt the file
                                const encryptionResult = decodeEncryptionResult(encryptedBuffer);
                                fileBuffer = await decryptBuffer(encryptionResult, ENCRYPTION_PASSWORD);
                            } catch (error) {
                                console.warn(`Could not decrypt file ${fileName}: ${error}`);
                                return;
                            }
                        } else {
                            fileBuffer = await fs.readFile(filePath);
                        }

                        const fileExtension = path.extname(originalName);
                        const sanitizedDescription = entry.description.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
                        const zipFileName = `${entry.type}_${index + 1}_${sanitizedDescription}${fileExtension}`;

                        archive.append(fileBuffer, {name: `attachments/${zipFileName}`});
                    } catch (error) {
                        console.warn(`Could not add attachment ${entry.attachment}: ${error}`);
                    }
                });

            Promise.all(attachmentPromises).then(() => {
                archive.finalize();
            }).catch(reject);
        });
    }
}