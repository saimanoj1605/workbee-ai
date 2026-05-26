import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware";
import * as gigService from "../services/gig.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

export const createGig = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const gig = await gigService.createGig(req.userId!, req.body);
    sendSuccess(res, gig, 201, "Gig created");
  }
);

export const getGigs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await gigService.listGigs(req.query);
  sendSuccess(res, result);
});

export const applyToGig = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const application = await gigService.applyToGig(
      req.userId!,
      String(req.params.gigId),
      req.body
    );
    sendSuccess(res, application, 201, "Application submitted");
  }
);

export const updateApplication = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const application = await gigService.updateApplicationStatus(
      req.userId!,
      String(req.params.gigId),
      String(req.params.applicationId),
      req.body
    );
    sendSuccess(res, application, 200, "Application updated");
  }
);

export const emergencyDispatch = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await gigService.emergencyDispatch(
      req.userId!,
      String(req.params.gigId),
      req.body
    );
    sendSuccess(res, result, 200, "Emergency dispatch sent");
  }
);

export const updateWorkerPhase = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await gigService.updateWorkerPhase(
      req.userId!,
      String(req.params.gigId),
      String(req.params.applicationId),
      req.body
    );
    sendSuccess(res, result, 200, "Worker phase updated");
  }
);

export const verifyWork = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await gigService.verifyWork(
      req.userId!,
      String(req.params.gigId),
      String(req.params.applicationId),
      req.body
    );
    sendSuccess(res, result, 200, "Work verified");
  }
);
