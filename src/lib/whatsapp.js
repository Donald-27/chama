// Helper to open WhatsApp with a prefilled message.
export function buildWhatsAppUrl(phoneNumber, message) {
    // phoneNumber should be numeric international e.g. 254724779523 (country code then number, no +)
    const encoded = encodeURIComponent(message);
    // Use wa.me link
    return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

export function openWhatsApp(phoneNumber, message) {
    const url = buildWhatsAppUrl(phoneNumber, message);
    window.location.href = url;
}

export function generateOrderCode() {
    // simple short code
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
