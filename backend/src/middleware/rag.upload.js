import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { StatusCodes } from "http-status-codes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RAG_UPLOAD_FIELD_NAME = "file";
export const RAG_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const RAG_UPLOADS_ROOT = path.join(__dirname, "../../rag-uploads");

const MAX_FILE_SIZE_MB = RAG_MAX_FILE_SIZE_BYTES / (1024 * 1024);

const PDF_MIME_TYPE = "application/pdf";

/**
 * Determines whether an uploaded file is a PDF by MIME type or file extension.
 * Assumes that file is not NULL or undefined.
 * @param file - multer file object with mimetype and originalname
 * @returns {boolean} - true when the file is a PDF
 */
function isPdfFile(file) {
  return (
    file.mimetype === PDF_MIME_TYPE ||
    file.originalname.toLowerCase().endsWith(".pdf")
  );
}

const uploadPdfFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RAG_MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isPdfFile(file)) {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
}).single(RAG_UPLOAD_FIELD_NAME);

/**
 * Multer middleware wrapper that accepts a single PDF upload on the configured field name.
 * Assumes that req is not NULL or undefined.
 * @param req - Express request passed to multer
 * @param res - Express response passed to multer
 * @param next - Express next function; receives "Only PDF files are allowed." or "PDF file is required." on invalid or missing uploads
 * @returns {void}
 */
export const handlePdfUpload = (req, res, next) => {
  uploadPdfFile(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new Error("PDF file is required."));
    }

    next();
  });
};

/**
 * Writes the in-memory upload to disk for long-term storage and processing.
 * Assumes that req.user.id and req.file.buffer are not NULL or undefined when a file is present.
 * @param req - Express request with authenticated user and multer file in memory
 * @returns {Promise<string|null>} - relative storage path such as "1/uuid.pdf", or null when userId or file buffer is missing
 */
export async function persistMemoryUpload(req) {
  const userId = req.user?.id;
  const file = req.file;

  if (!userId || !file?.buffer) {
    return null;
  }

  const userUploadDir = path.join(RAG_UPLOADS_ROOT, String(userId));
  await fs.mkdir(userUploadDir, { recursive: true });

  const extension = path.extname(file.originalname).toLowerCase() || ".pdf";
  const filename = `${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(userUploadDir, filename);

  await fs.writeFile(absolutePath, file.buffer);

  file.path = absolutePath;
  file.filename = filename;

  return `${userId}/${filename}`;
}

/**
 * Handles multer upload failures such as wrong file type, size limit, or missing file.
 * Assumes that err may be null when no upload error occurred.
 * @param err - multer or custom upload error, if any
 * @param req - Express request (unused)
 * @param res - Express response used to send 400 JSON with msg
 * @param next - Express next function; called with no args when err is absent
 * @returns {import('express').Response|void} - 400 JSON with messages such as "File exceeds the 5MB size limit." or err.message
 */
export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Upload field must be named "${RAG_UPLOAD_FIELD_NAME}".`,
      });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: err.message,
    });
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    msg: err.message || "Invalid file upload.",
  });
};
