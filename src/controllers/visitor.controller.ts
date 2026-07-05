import type { Request, Response, NextFunction } from "express";
import { UAParser } from "ua-parser-js";
import { TelegramService } from "../services/telegram.service";

// Helper to determine if an IP is local/internal
function isLocalIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") || // technically 172.16.0.0 - 172.31.255.255, but simple check is okay
    ip.startsWith("fe80:")
  );
}

export async function trackVisitor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { screen, referrer, path } = req.body;

    // 1. Resolve Client IP Address
    const rawIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "";

    // Clean up IPv6-mapped IPv4 addresses (like ::ffff:127.0.0.1)
    const clientIp = rawIp.startsWith("::ffff:") ? rawIp.substring(7) : rawIp;

    // 2. Fetch Geolocation Data
    let locationInfo = {
      country: "Unknown",
      countryCode: "N/A",
      regionName: "Unknown",
      city: "Unknown",
      isp: "Unknown",
    };

    if (clientIp && !isLocalIp(clientIp)) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}`);
        if (geoResponse.ok) {
          const geoData = (await geoResponse.json()) as any;
          if (geoData.status === "success") {
            locationInfo = {
              country: geoData.country || "Unknown",
              countryCode: geoData.countryCode || "N/A",
              regionName: geoData.regionName || "Unknown",
              city: geoData.city || "Unknown",
              isp: geoData.isp || "Unknown",
            };
          }
        }
      } catch (geoError) {
        console.error("Failed to fetch visitor geo location:", geoError);
      }
    } else {
      locationInfo = {
        country: "Local Host",
        countryCode: "LH",
        regionName: "Internal",
        city: "Localhost",
        isp: "Local Loopback Network",
      };
    }

    // 3. Parse User-Agent
    const userAgentStr = req.headers["user-agent"] || "";
    const parser = new UAParser(userAgentStr);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserInfo = browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown Browser";
    const osInfo = os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown OS";
    const deviceInfo = device.vendor
      ? `${device.vendor} ${device.model || ""} (${device.type || "unknown"})`.trim()
      : "Desktop";

    // 4. Format and Send Telegram Notification
    const telegramMessage = [
      `🔔 *New Unique Visitor Alert*`,
      `\n*📍 Location Details:*`,
      `🌍 *Country:* ${locationInfo.country} (${locationInfo.countryCode})`,
      `🏢 *City/Region:* ${locationInfo.city}, ${locationInfo.regionName}`,
      `⚙️ *ISP:* ${locationInfo.isp}`,
      `🌐 *IP Address:* ${clientIp || "Unavailable"}`,
      `\n*🖥️ Device & Browser:*`,
      `🖥️ *Screen Size:* ${screen || "Unknown"}`,
      `🧭 *Browser:* ${browserInfo}`,
      `💻 *OS:* ${osInfo}`,
      `📱 *Device:* ${deviceInfo}`,
      `\n*🧭 Navigation:*`,
      `🔗 *Referrer:* ${referrer || "Direct / Unknown"}`,
      `🗂️ *Landed On:* ${path || "/"}`,
    ].join("\n");

    await TelegramService.sendMessage(telegramMessage);

    res.status(200).json({ success: true });
  } catch (error: any) {
    next(error);
  }
}
