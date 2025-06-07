import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isAuthenticated } from '../middleware/auth';
import { join } from 'path';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
const ensureUploadDir = async (userId: string) => {
  const userDir = join(UPLOAD_DIR, userId);
  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }
  return userDir;
};

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf', // PDF
  'image/jpeg', // JPEG
  'image/png', // PNG
  'image/gif', // GIF
  'application/msword', // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
];

export const uploadRouter = new Hono();

// Apply CORS
uploadRouter.use('*', cors({
  origin: (o) => allowedOrigins.includes(o!) ? o : undefined,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
}));

// Upload file endpoint
uploadRouter.post('/', isAuthenticated, async (c) => {
  try {
    const userId = c.get('userId');

    // Ensure multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File too large. Maximum size is 10MB' }, 400);
    }

    // Check file type
    const fileType = file.type;
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return c.json({
        error: 'Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX'
      }, 400);
    }

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const fileName = `${timestamp}-${originalName}`;

    // Ensure upload directory exists
    const userDir = await ensureUploadDir(userId);
    const filePath = join(userDir, fileName);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Generate URL for the file
    // In a production environment, this would be a proper URL to a file server or CDN
    const fileUrl = `/api/files/${userId}/${fileName}`;

    return c.json({
      success: true,
      fileName: originalName,
      fileUrl,
      fileType
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Serve files endpoint (for development purposes)
// In production, you would use a proper file server or CDN
uploadRouter.get('/:userId/:fileName', async (c) => {
  try {
    const { userId, fileName } = c.req.param();
    const filePath = join(UPLOAD_DIR, userId, fileName);

    // Check if file exists
    if (!existsSync(filePath)) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Read the file content
    const fileBuffer = await readFile(filePath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.gif')) contentType = 'image/gif';
    else if (fileName.endsWith('.doc')) contentType = 'application/msword';
    else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Return file with actual content
    return c.body(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${decodeURIComponent(fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return c.json({ error: 'Failed to serve file' }, 500);
  }
});