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
