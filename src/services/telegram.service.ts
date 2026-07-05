export class TelegramService {
  private static getBotConfig() {
    const botId = process.env.TELEGRAM_BOT_ID;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botId || !chatId) {
      throw new Error("Telegram configuration (TELEGRAM_BOT_ID or TELEGRAM_CHAT_ID) is missing.");
    }

    return { botId, chatId };
  }

  /**
   * Send a text message to the configured Telegram chat
   */
  static async sendMessage(text: string): Promise<any> {
    const { botId, chatId } = this.getBotConfig();
    const url = `https://api.telegram.org/bot${botId}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram SendMessage API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Send a file/document to the configured Telegram chat
   */
  static async sendDocument(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    caption?: string
  ): Promise<any> {
    const { botId, chatId } = this.getBotConfig();
    const url = `https://api.telegram.org/bot${botId}/sendDocument`;

    const formData = new FormData();
    formData.append("chat_id", chatId);

    // Create a Blob from the buffer to be appended as a File in FormData
    const blob = new Blob([fileBuffer], { type: mimetype });
    formData.append("document", blob, filename);

    if (caption) {
      formData.append("caption", caption);
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram SendDocument API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
