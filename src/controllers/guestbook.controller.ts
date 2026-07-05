import type { Request, Response, NextFunction } from "express";
import { TelegramService } from "../services/telegram.service";

export async function notifyGuestbook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userName, userEmail, text } = req.body;

    if (!userName || !text) {
      res.status(400).json({ success: false, error: "userName and text are required." });
      return;
    }

    const telegramMessage = [
      `✉️ *Guestbook Entry*`,
      `*Name:* ${userName}`,
      `*Email:* ${userEmail || "N/A"}`,
      `*Message:* ${text}`,
    ].join("\n");

    await TelegramService.sendMessage(telegramMessage);

    res.status(200).json({ success: true, message: "Guestbook alert sent successfully." });
  } catch (error: any) {
    next(error);
  }
}
