import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Validates national digits against the selected country (ISO 3166-1 alpha-2, e.g. from CountryPicker).
 * @param {string} countryIso - e.g. "US", "PK"
 * @param {string} nationalNumber - user input (national part only)
 * @returns {{ ok: true, e164: string } | { ok: false, message: string }}
 */
export function validatePhoneForCountry(countryIso, nationalNumber) {
  const digits = String(nationalNumber || '').replace(/\D/g, '');
  if (!digits) {
    return { ok: false, message: 'Please enter phone number to continue' };
  }
  try {
    const parsed = parsePhoneNumberFromString(digits, countryIso);
    if (parsed && parsed.isValid()) {
      return { ok: true, e164: parsed.format('E.164') };
    }
  } catch {
    // invalid combination
  }
  return {
    ok: false,
    message: 'Please enter a valid phone number for your country',
  };
}
