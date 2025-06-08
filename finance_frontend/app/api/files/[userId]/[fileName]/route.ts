import {NextRequest} from 'next/server';

export async function GET(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // The path will be like /api/files/[userId]/[fileName]
    const parts = pathname.split('/');

    // /api/files/[userId]/[fileName], parts will be ['', 'api', 'files', userId, fileName]
    const userId = parts[3];
    const fileName = parts[4];

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8558';

    try {
        const response = await fetch(
            `${backendUrl}/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`
        );

        if (!response.ok) {
            return new Response('File not found', {status: 404});
        }

        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new Response(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error('Error fetching file:', error);
        return new Response('Error fetching file', {status: 500});
    }
}