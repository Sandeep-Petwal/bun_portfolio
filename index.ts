import express from "express";
import cors from "cors";
import apiRouter from "./src/routes/api";
import { apiLimiter } from "./src/middleware/limiter.middleware";
import { errorHandler } from "./src/middleware/error.middleware";

const app = express();
const port = process.env.PORT || 5000;

const parseOriginList = (value: string) =>
  value
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const wildcardToRegex = (pattern: string) =>
  new RegExp(
    `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
    "i"
  );

const isHttpOrigin = (value: string) => /^https?:\/\//i.test(value);

const matchesAllowedOrigin = (origin: string, allowedOrigin: string) => {
  const normalizedAllowedOrigin = allowedOrigin.trim().replace(/\/$/, "");

  if (!normalizedAllowedOrigin || normalizedAllowedOrigin === "*") {
    return false;
  }

  if (isHttpOrigin(normalizedAllowedOrigin)) {
    return wildcardToRegex(normalizedAllowedOrigin).test(origin);
  }

  try {
    const { hostname } = new URL(origin);
    return wildcardToRegex(normalizedAllowedOrigin).test(hostname);
  } catch {
    return false;
  }
};

// Setup CORS based on NODE_ENV (checking both standard and common typo spellings)
const isDevelopment =
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "developement";

const corsOriginStr = isDevelopment
  ? process.env.CORS_ALLOWED_ORIGINS_DEV ||
    process.env.CORS_ORIGIN_DEV ||
    "http://localhost:*,http://127.0.0.1:*,https://*.sandeep.cv"
  : process.env.CORS_ALLOWED_ORIGINS ||
    process.env.CORS_ORIGIN_PROD ||
    "https://*.sandeep.cv,https://sandeep.cv";

const allowedOrigins = parseOriginList(corsOriginStr);

console.log(
  `CORS mode=${isDevelopment ? "development" : "production"} NODE_ENV=${
    process.env.NODE_ENV || "(not set)"
  } allowedOrigins=${allowedOrigins.join(",")}`
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.some((allowedOrigin) =>
          matchesAllowedOrigin(origin, allowedOrigin)
        )
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check / Root route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Portfolio Backend is running!" });
});

// API Routes with Rate Limiter
app.use("/api", apiLimiter, apiRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Portfolio backend running on http://localhost:${port}`);
});
