import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as chatService from "../services/chat.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const getMessages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const peerId = String(req.query.peerId ?? "");
    const result = await chatService.getConversationMessages(
      req.userId!,
      peerId
    );
    sendSuccess(res, result);
  }
);

