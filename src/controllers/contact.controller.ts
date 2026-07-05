import type { Request, Response, NextFunction } from "express";
import { TelegramService } from "../services/telegram.service";

export async function submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: "Name, email, and message are required." });
      return;
    }

    const telegramMessage = [
      `✉️ *New Contact Form Submission*`,
      `*Name:* ${name}`,
      `*Email:* ${email}`,
      subject ? `*Subject:* ${subject}` : null,
      `*Message:* ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    await TelegramService.sendMessage(telegramMessage);

    res.status(200).json({ success: true, message: "Contact request processed successfully." });
  } catch (error: any) {
    next(error);
  }
}
