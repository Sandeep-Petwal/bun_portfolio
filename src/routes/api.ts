import { Router } from "express";
import multer from "multer";
import { submitContact } from "../controllers/contact.controller";
import { submitAnonymous } from "../controllers/anonymous.controller";
import { notifyGuestbook } from "../controllers/guestbook.controller";
import { trackVisitor } from "../controllers/visitor.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate.middleware";
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
  "/anonymous",
  upload.single("document"),
  validate(anonymousSchema),
  asyncHandler(submitAnonymous)
);
router.post("/guestbook", validate(guestbookSchema), asyncHandler(notifyGuestbook));
router.post("/visitors/track", validate(trackVisitorSchema), asyncHandler(trackVisitor));

export default router;
