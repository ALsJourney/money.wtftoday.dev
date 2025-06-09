import {existsSync} from "node:fs";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {Hono} from "hono";
import {cors} from "hono/cors";
import {isAuthenticated} from "../middleware/auth";
import {
    encryptBuffer,
    decryptBuffer,
    encodeEncryptionResult,
    decodeEncryptionResult
} from "../utils/crypto";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD || "default-password-change-me";

// Ensure upload directory exists
const ensureUploadDir = async (userId: string) => {
    const userDir = join(UPLOAD_DIR, userId);
    if (!existsSync(userDir)) {
        await mkdir(userDir, {recursive: true});
    }
    return userDir;
};

// Allowed file types
const ALLOWED_MIME_TYPES = [
    "application/pdf", // PDF
    "image/jpeg", // JPEG
    "image/png", // PNG
    "image/gif", // GIF
    "application/msword", // DOC
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
];

export const uploadRouter = new Hono();

// Apply CORS
uploadRouter.use(
    "*",
    cors({
        origin: (o) => (allowedOrigins.includes(o!) ? o : undefined),
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        credentials: true,
    }),
);

// Upload file endpoint with encryption
uploadRouter.post("/", isAuthenticated, async (c) => {
    try {
        const userId = c.get("userId");

        // Ensure multipart form data
        const formData = await c.req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return c.json({error: "No file provided"}, 400);
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return c.json({error: "File too large. Maximum size is 10MB"}, 400);
        }

        // Check file type
        const fileType = file.type;
        if (!ALLOWED_MIME_TYPES.includes(fileType)) {
            return c.json(
                {
                    error:
                        "Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX",
                },
                400,
            );
        }

        // Create unique filename
        const timestamp = Date.now();
        const originalName = file.name;
        const fileName = `${timestamp}-${originalName}.encrypted`;

        // Ensure upload directory exists
        const userDir = await ensureUploadDir(userId);
        const filePath = join(userDir, fileName);

        // Get file buffer and encrypt it
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // Encrypt the file content
        const encryptionResult = await encryptBuffer(originalBuffer, ENCRYPTION_PASSWORD);
        const encryptedBuffer = encodeEncryptionResult(encryptionResult);

        // Save encrypted file
        await writeFile(filePath, encryptedBuffer);

        // Store metadata (you might want to save this to database)
        const metadata = {
            originalName,
            fileType,
            originalSize: file.size,
            encryptedSize: encryptedBuffer.length,
            uploadDate: new Date().toISOString(),
        };

        // Save metadata file
        const metadataPath = join(userDir, `${fileName}.meta`);
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

        // Generate URL for the file
        const fileUrl = `/api/files/${userId}/${fileName}`;

        return c.json({
            success: true,
            fileName: originalName,
            fileUrl,
            fileType,
            encrypted: true,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return c.json({error: "Failed to upload file"}, 500);
    }
});

// Serve encrypted files endpoint with decryption
uploadRouter.get("/:userId/:fileName", async (c) => {
    try {
        const {userId, fileName} = c.req.param();

        // Handle both encrypted and legacy unencrypted files
        let filePath = join(UPLOAD_DIR, userId, fileName);
        let isEncrypted = fileName.endsWith('.encrypted');

        // If not encrypted, check if original file exists
        if (!isEncrypted) {
            const encryptedPath = join(UPLOAD_DIR, userId, `${fileName}.encrypted`);
            if (existsSync(encryptedPath)) {
                filePath = encryptedPath;
                isEncrypted = true;
            }
        }

        // Check if file exists
        if (!existsSync(filePath)) {
            return c.json({error: "File not found"}, 404);
        }

        let fileBuffer: Buffer;
        let originalName = fileName;
        let contentType = "application/octet-stream";

        if (isEncrypted) {
            // Read and decrypt the file
            const encryptedBuffer = await readFile(filePath);
            const encryptionResult = decodeEncryptionResult(encryptedBuffer);
            fileBuffer = await decryptBuffer(encryptionResult, ENCRYPTION_PASSWORD);

            // Try to read metadata for original filename and content type
            const metadataPath = `${filePath}.meta`;
            if (existsSync(metadataPath)) {
                try {
                    const metadataContent = await readFile(metadataPath, 'utf-8');
                    const metadata = JSON.parse(metadataContent);
                    originalName = metadata.originalName;
                    contentType = metadata.fileType;
                } catch (e) {
                    console.warn("Could not read metadata file:", e);
                }
            }
        } else {
            // Read unencrypted file (legacy support)
            fileBuffer = await readFile(filePath);
        }

        // Determine content type from filename if not from metadata
        if (contentType === "application/octet-stream") {
            if (originalName.endsWith(".pdf")) contentType = "application/pdf";
            else if (originalName.endsWith(".jpg") || originalName.endsWith(".jpeg"))
                contentType = "image/jpeg";
            else if (originalName.endsWith(".png")) contentType = "image/png";
            else if (originalName.endsWith(".gif")) contentType = "image/gif";
            else if (originalName.endsWith(".doc")) contentType = "application/msword";
            else if (originalName.endsWith(".docx"))
                contentType =
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        // Return decrypted file
        return c.body(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${decodeURIComponent(originalName)}"`,
                "Content-Length": fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return c.json({error: "Failed to serve file"}, 500);
    }
});

// NEW: Download endpoint that forces file download instead of inline viewing
uploadRouter.get("/:userId/:fileName/download", isAuthenticated, async (c) => {
    try {
        const {userId, fileName} = c.req.param();
        const requestUserId = c.get("userId");

        // Only allow users to download their own files
        if (userId !== requestUserId) {
            return c.json({error: "Unauthorized"}, 403);
        }

        // Handle both encrypted and legacy unencrypted files
        let filePath = join(UPLOAD_DIR, userId, fileName);
        let isEncrypted = fileName.endsWith('.encrypted');

        // If not encrypted, check if original file exists
        if (!isEncrypted) {
            const encryptedPath = join(UPLOAD_DIR, userId, `${fileName}.encrypted`);
            if (existsSync(encryptedPath)) {
                filePath = encryptedPath;
                isEncrypted = true;
            }
        }

        // Check if file exists
        if (!existsSync(filePath)) {
            return c.json({error: "File not found"}, 404);
        }

        let fileBuffer: Buffer;
        let originalName = fileName;
        let contentType = "application/octet-stream";

        if (isEncrypted) {
            // Read and decrypt the file
            const encryptedBuffer = await readFile(filePath);
            const encryptionResult = decodeEncryptionResult(encryptedBuffer);
            fileBuffer = await decryptBuffer(encryptionResult, ENCRYPTION_PASSWORD);

            // Try to read metadata for original filename and content type
            const metadataPath = `${filePath}.meta`;
            if (existsSync(metadataPath)) {
                try {
                    const metadataContent = await readFile(metadataPath, 'utf-8');
                    const metadata = JSON.parse(metadataContent);
                    originalName = metadata.originalName;
                    contentType = metadata.fileType;
                } catch (e) {
                    console.warn("Could not read metadata file:", e);
                }
            }
        } else {
            // Read unencrypted file (legacy support)
            fileBuffer = await readFile(filePath);
        }

        // Determine content type from filename if not from metadata
        if (contentType === "application/octet-stream") {
            if (originalName.endsWith(".pdf")) contentType = "application/pdf";
            else if (originalName.endsWith(".jpg") || originalName.endsWith(".jpeg"))
                contentType = "image/jpeg";
            else if (originalName.endsWith(".png")) contentType = "image/png";
            else if (originalName.endsWith(".gif")) contentType = "image/gif";
            else if (originalName.endsWith(".doc")) contentType = "application/msword";
            else if (originalName.endsWith(".docx"))
                contentType =
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        // Remove .encrypted suffix if present for download filename
        const downloadName = originalName.replace('.encrypted', '');

        // Return decrypted file with download headers
        return c.body(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
                "Content-Length": fileBuffer.length.toString(),
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });
    } catch (error) {
        console.error("Error downloading file:", error);
        return c.json({error: "Failed to download file"}, 500);
    }
});

// Optional: Add endpoint to list encrypted files
uploadRouter.get("/:userId", isAuthenticated, async (c) => {
    try {
        const {userId} = c.req.param();
        const requestUserId = c.get("userId");

        // Only allow users to list their own files
        if (userId !== requestUserId) {
            return c.json({error: "Unauthorized"}, 403);
        }

        const userDir = join(UPLOAD_DIR, userId);
        if (!existsSync(userDir)) {
            return c.json({files: []});
        }

        const fs = await import("node:fs/promises");
        const files = await fs.readdir(userDir);

        const fileList = [];
        for (const file of files) {
            if (file.endsWith('.encrypted')) {
                const metadataPath = join(userDir, `${file}.meta`);
                let metadata = null;

                if (existsSync(metadataPath)) {
                    try {
                        const metadataContent = await readFile(metadataPath, 'utf-8');
                        metadata = JSON.parse(metadataContent);
                    } catch (e) {
                        console.warn("Could not read metadata:", e);
                    }
                }

                fileList.push({
                    fileName: file,
                    originalName: metadata?.originalName || file.replace('.encrypted', ''),
                    fileType: metadata?.fileType || 'unknown',
                    uploadDate: metadata?.uploadDate || null,
                    size: metadata?.originalSize || null,
                    fileUrl: `/api/files/${userId}/${file}`
                });
            }
        }

        return c.json({files: fileList});
    } catch (error) {
        console.error("Error listing files:", error);
        return c.json({error: "Failed to list files"}, 500);
    }
});