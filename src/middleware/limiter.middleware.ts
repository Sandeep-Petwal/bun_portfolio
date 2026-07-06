import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 requests per 15-minute window
  standardHeaders: "draft-7", // Return rate limit info in standard headers
  legacyHeaders: false, // Disable X-RateLimit headers
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

export const quickSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.QUICK_SEND_RATE_LIMIT || 5),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many quick-send requests from this IP, please try again in a minute.",
  },
});
