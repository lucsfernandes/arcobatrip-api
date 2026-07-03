import { Request, Response, NextFunction } from "express";
import multer from "multer";

/** Accepted avatar mimetypes. */
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];
/** 5 MB upload ceiling. */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const INVALID_MIME = "INVALID_MIME";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(INVALID_MIME));
    }
  },
}).single("file");

function reject(res: Response, message: string): void {
  res.status(400).json({ error: { code: "validation_error", message } });
}

/**
 * Parse a single multipart `file` field into `req.file` (memory storage), mapping
 * multer failures onto the contract error envelope: oversized file / bad mimetype
 * → 400 `validation_error`.
 */
export const uploadAvatarMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          reject(res, "Arquivo excede o limite de 5MB");
          return;
        }
        reject(res, "Falha no upload do arquivo");
        return;
      }
      if (err instanceof Error && err.message === INVALID_MIME) {
        reject(res, "Formato inválido. Envie uma imagem JPEG, PNG ou WebP.");
        return;
      }
      reject(res, "Falha no upload do arquivo");
      return;
    }
    next();
  });
};
