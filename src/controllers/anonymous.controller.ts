import type { Request, Response, NextFunction } from "express";
import { TelegramService } from "../services/telegram.service";

export async function submitAnonymous(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, message } = req.body;
    const file = req.file;

    // A message is required if no file is uploaded.
    if (!message && !file) {
      res.status(400).json({ success: false, error: "A message or file attachment is required." });
      return;
    }

    if (file) {
      // Build caption
      const captionParts = [
        message ? `Message: ${message}` : null,
        name ? `Name: ${name}` : null,
        email ? `Email: ${email}` : null,
      ].filter(Boolean);

      const caption = captionParts.join("\n") || "(No message)";

      await TelegramService.sendDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        caption
      );
    } else {
      // Send text-only message
      const text = [
        `✉️ *Anonymous Message*`,
        `*Name:* ${name || "Anonymous"}`,
        `*Email:* ${email || "N/A"}`,
        `*Message:* ${message}`,
      ].join("\n");

      await TelegramService.sendMessage(text);
    }

    res.status(200).json({ success: true, message: "Anonymous message sent successfully." });
  } catch (error: any) {
    next(error);
  }
}
