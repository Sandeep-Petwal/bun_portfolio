import express from "express";
import cors from "cors";
import apiRouter from "./src/routes/api";
import { apiLimiter } from "./src/middleware/limiter.middleware";
import { errorHandler } from "./src/middleware/error.middleware";

const app = express();
const port = process.env.PORT || 5000;

// Setup CORS based on NODE_ENV (checking both standard and common typo spellings)
const isDevelopment =
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "developement";

const corsOriginStr = isDevelopment
  ? process.env.CORS_ORIGIN_DEV || "http://localhost:1010"
  : process.env.CORS_ORIGIN_PROD || "https://new.sandeep.cv";

const allowedOrigins = corsOriginStr.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
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