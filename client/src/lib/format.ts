/**
 * Utility to format phone numbers cleanly across the frontend.
 * Removes `@s.whatsapp.net`, `:device` numbers, and formats internationally.
 * e.g. "919876543210@s.whatsapp.net" -> "+91 98765 43210"
 * e.g. "14155552671" -> "+1 (415) 555-2671"
 */
export function formatPhoneNumber(input: string | null | undefined): string {
  if (!input) return '—';

  // Extract raw digits
  const rawJid = input.split('@')[0].split(':')[0];
  const digits = rawJid.replace(/[^0-9]/g, '');

  if (!digits) return input;

  if (digits.length === 12 && digits.startsWith('91')) {
    // India: +91 98765 43210
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US / Canada: +1 (415) 555-2671
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 12 && digits.startsWith('44')) {
    // UK: +44 7123 456789
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 10) {
    // 10-digit number: 98765 43210
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length > 5) {
    return `+${digits.slice(0, digits.length - 10 || 2)} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
  }

  return `+${digits}`;
}
