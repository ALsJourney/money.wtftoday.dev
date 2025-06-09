/**
 * API client for file upload-related endpoints
 */
import {honoFetch} from "@/lib/api/hono-client";
import {UploadSuccess} from "@/types/uploads";

export const uploadApi = {
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        return honoFetch<UploadSuccess>('/api/upload', {
            method: 'POST',
            body: formData, // Browser sets correct Content-Type including boundary for multipart/form-data
        });
    },
    fetchFileByPath: async (userId: string, fileName: string) => {
        return honoFetch<Response>(`/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`, {
            method: "GET",
        });
    },
    downloadFileByPath: async (userId: string, fileName: string) => {
        return honoFetch<Response>(`/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}/download`, {
            method: "GET",
            headers: {
                "Accept": "application/octet-stream",
            },
        });
    }
};