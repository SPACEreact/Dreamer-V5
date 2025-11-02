import { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Basic centralized error handler
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err as any);
  const message = err instanceof Error ? err.message : "Unknown server error";
  const status = (err as any)?.status || 500;
  res.status(status).json({ error: message });
}