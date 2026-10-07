/**
 * Monta o link do WhatsApp com mensagem pronta.
 * @param {string} number  Número só com dígitos, com DDI (ex.: 5534999999999)
 * @param {string} [message]
 */
export function buildWhatsAppUrl(number, message) {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
