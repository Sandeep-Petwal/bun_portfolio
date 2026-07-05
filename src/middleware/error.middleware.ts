import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("🔥 Error caught by Global Handler:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.issues.map((e: any) => ({
        field: e.path.filter((p: any) => p !== "body" && p !== "query" && p !== "params").join("."),
        message: e.message,
      })),
    });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";

  res.status(status).json({
    success: false,
    error: message,
  });
}
