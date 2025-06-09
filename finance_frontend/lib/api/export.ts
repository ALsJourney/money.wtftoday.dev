import {honoFetch} from "@/lib/api/hono-client";

export const exportAPI = {
    downloadTaxReport: async (year: number) => {
        try {
            const response = await honoFetch<Response>(`/api/export/tax-report/${year}`, {
                method: 'GET',
                headers: {
                    "Accept": "application/zip",
                },
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Einkommenssteuer_${year}_Komplett.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }
};