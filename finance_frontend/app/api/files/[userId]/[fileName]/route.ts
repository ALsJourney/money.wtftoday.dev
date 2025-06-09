import {NextRequest} from 'next/server';

export async function GET(request: NextRequest) {
    const {pathname, searchParams} = request.nextUrl;

    // The path will be like /api/files/[userId]/[fileName] or /api/files/[userId]/[fileName]/download
    const parts = pathname.split('/');

    // /api/files/[userId]/[fileName], parts will be ['', 'api', 'files', userId, fileName, ?download]
    const userId = parts[3];
    const fileName = parts[4];
    const isDownload = parts[5] === 'download' || searchParams.get('download') === 'true';

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8558';

    try {
        // Build the backend URL
        let backendPath = `/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
        if (isDownload) {
            backendPath += '/download';
        }

        // Forward the request to the backend with auth headers
        const headers: HeadersInit = {};

        // Forward authorization header if present
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        // Forward cookies for authentication
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const response = await fetch(`${backendUrl}${backendPath}`, {
            headers,
        });

        if (!response.ok) {
            return new Response('File not found', {status: response.status});
        }

        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition');

        const responseHeaders: HeadersInit = {
            'Content-Type': contentType,
        };

        if (contentDisposition) {
            responseHeaders['Content-Disposition'] = contentDisposition;
        } else {
            responseHeaders['Content-Disposition'] = isDownload
                ? `attachment; filename="${fileName}"`
                : `inline; filename="${fileName}"`;
        }

        return new Response(fileBuffer, {
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Error fetching file:', error);
        return new Response('Error fetching file', {status: 500});
    }
}