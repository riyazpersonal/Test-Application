export function openSupportChat(onUnavailable) {
  const whatsappNumber = import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER;
  if (!whatsappNumber) {
    onUnavailable?.("Support Desk isn't configured yet — set VITE_SUPPORT_WHATSAPP_NUMBER in client/.env.");
    return;
  }
  window.open(`https://wa.me/${whatsappNumber}`, "_blank", "noopener,noreferrer");
}
