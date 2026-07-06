import type { Request, Response, NextFunction } from "express";
import { TelegramService } from "../services/telegram.service";

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() || req.ip;
  }

  return req.ip;
}

function getQuickSendToken(req: Request) {
  const headerToken = req.header("x-quick-token");
  const authHeader = req.header("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : undefined;
  const queryToken = typeof req.query.key === "string" ? req.query.key : undefined;

  return headerToken || bearerToken || queryToken;
}

function extractText(body: unknown) {
  if (typeof body === "string") {
    return body.trim();
  }

  if (!body || typeof body !== "object") {
    return "";
  }

  const value = body as Record<string, unknown>;
  const directText = value.text || value.message || value.body;

  if (typeof directText === "string" && directText.trim()) {
    return directText.trim();
  }

  const entries = Object.entries(value);

  if (entries.length === 1) {
    const entry = entries[0];

    if (!entry) {
      return "";
    }

    const [key, entryValue] = entry;

    if (typeof entryValue === "string" && entryValue.trim()) {
      return entryValue.trim();
    }

    if (entryValue === "" && key.trim()) {
      return key.trim();
    }
  }

  return "";
}

function extractQueryText(req: Request) {
  const value = req.query.m || req.query.text || req.query.message;
  return typeof value === "string" ? value.trim() : "";
}

function extractFile(req: Request) {
  if (req.file) {
    return req.file;
  }

  const files = req.files;

  if (!files || Array.isArray(files)) {
    return undefined;
  }

  return files.file?.[0] || files.document?.[0];
}

export async function quickSend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configuredToken = process.env.QUICK_SEND_TOKEN;

    if (configuredToken && getQuickSendToken(req) !== configuredToken) {
      res.status(401).json({ success: false, error: "Invalid quick-send token." });
      return;
    }

    const file = extractFile(req);
    const text = extractText(req.body) || extractQueryText(req);
    const source = getClientIp(req);

    if (!file && !text) {
      res.status(400).json({
        success: false,
        error: "Send text or attach a file.",
        examples: [
          'curl -X POST https://api.sandeep.cv/api/q -d "hello"',
          'curl "https://api.sandeep.cv/api/q?m=hello"',
          "curl -X POST https://api.sandeep.cv/api/q -F file=@file.txt",
        ],
      });
      return;
    }

    const caption = [
      "Quick Send",
      `From: ${source}`,
      text ? `Message: ${text}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (file) {
      await TelegramService.sendDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        caption
      );
    } else {
      await TelegramService.sendMessage(caption);
    }

    res.status(200).json({ success: true, message: "Sent to Telegram." });
  } catch (error: any) {
    next(error);
  }
}
