import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";

type UploadRequest = AuthRequest & { file?: Express.Multer.File };
import { uploadImage } from "../services/upload.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const uploadFile = asyncHandler(
  async (req: UploadRequest, res: Response) => {
    const file = req.file;
    if (!file) throw new AppError("No file provided", 400);

    const folder = (req.body.folder as string) || "workbee";
    const result = await uploadImage(file.buffer, folder);
    sendSuccess(res, result, 201, "File uploaded");
  }
);
