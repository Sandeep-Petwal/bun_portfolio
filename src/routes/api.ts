import express, { Router } from "express";
import multer from "multer";
import { submitContact } from "../controllers/contact.controller";
import { submitAnonymous } from "../controllers/anonymous.controller";
import { notifyGuestbook } from "../controllers/guestbook.controller";
import { trackVisitor } from "../controllers/visitor.controller";
import { quickSend } from "../controllers/quick-send.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import { quickSendLimiter } from "../middleware/limiter.middleware";
import {
  contactSchema,
  anonymousSchema,
  guestbookSchema,
  trackVisitorSchema,
} from "../validators/api.validators";

const router = Router();

// Setup in-memory multer for handling file uploads (up to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB in bytes
  },
});

router.post("/contact", validate(contactSchema), asyncHandler(submitContact));
router.post(
  ["/q", "/quick"],
  quickSendLimiter,
  express.text({ type: ["text/*"], limit: "50mb" }),
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  asyncHandler(quickSend)
);
router.get(["/q", "/quick"], quickSendLimiter, asyncHandler(quickSend));
router.post(
  "/anonymous",
  upload.single("document"),
  validate(anonymousSchema),
  asyncHandler(submitAnonymous)
);
router.post("/guestbook", validate(guestbookSchema), asyncHandler(notifyGuestbook));
router.post("/visitors/track", validate(trackVisitorSchema), asyncHandler(trackVisitor));

export default router;
