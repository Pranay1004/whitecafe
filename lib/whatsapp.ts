// ============================================
// WhatsApp API Integration Utility
// ============================================
// To send automatic WhatsApp messages without user click,
// configure these env variables in Vercel:
// - WHATSAPP_API_KEY (API token)
// - WHATSAPP_INSTANCE_ID (Gateway instance ID, e.g. from UltraMsg)
// - STAFF_WHATSAPP_NUMBER (Number to notify, e.g. +91XXXXXXXXXX)

export async function sendWhatsAppMessage(to: string, message: string) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  if (!apiKey || !instanceId) {
    console.log(`\n========================================`);
    console.log(`[WHATSAPP AUTOMATED NOTIFICATION]`);
    console.log(`To: ${to}`);
    console.log(`Message:\n${message}`);
    console.log(`========================================\n`);
    return { success: true, mock: true };
  }

  try {
    // We send via a standard WhatsApp Gateway URL (UltraMsg example)
    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: apiKey,
        to: to,
        body: message,
      }),
    });
    const data = await response.json();
    return { success: true, apiResponse: data };
  } catch (error) {
    console.error(`[WHATSAPP NOTIFY ERROR] Failed to send to ${to}:`, error);
    return { success: false, error };
  }
}
