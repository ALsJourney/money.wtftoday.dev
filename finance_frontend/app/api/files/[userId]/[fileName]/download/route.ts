import {NextRequest} from 'next/server';

export async function GET(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // The path will be like /api/files/[userId]/[fileName]/download
    const parts = pathname.split('/');

    // parts will be ['', 'api', 'files', userId, fileName, 'download']
    const userId = parts[3];
    const fileName = parts[4];

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8558';

    try {
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

        const response = await fetch(
            `${backendUrl}/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}/download`,
            {headers}
        );

        if (!response.ok) {
            return new Response('File not found', {status: response.status});
        }

        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="${fileName}"`;

        return new Response(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition,
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        return new Response('Error downloading file', {status: 500});
    }
}