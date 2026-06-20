// ============================================
// WhatsApp API Integration Utility
// ============================================
// To send automatic WhatsApp messages without user click,
// configure these env variables in Vercel:
// - WHATSAPP_API_KEY (API token)
// - WHATSAPP_INSTANCE_ID (Gateway instance ID, e.g. from UltraMsg)
// - STAFF_WHATSAPP_NUMBER (Number to notify, e.g. +91XXXXXXXXXX)

export async function sendWhatsAppMessage(to: string, message: string) {
  console.log(`\n========================================`);
  console.log(`[WHATSAPP MOCK NOTIFICATION]`);
  console.log(`To: ${to}`);
  console.log(`Message:\n${message}`);
  console.log(`========================================\n`);
  return { success: true, mock: true };
}

