import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString
} from "libphonenumber-js/min";
import type { CountryCode, PhoneNumber } from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";

export const DEFAULT_WHATSAPP_COUNTRY: CountryCode = "BR";
export const DEFAULT_WHATSAPP_PREFIX = "+55 ";

export type WhatsappCountry = {
  iso2: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
};

const PREFERRED_COUNTRIES: CountryCode[] = [
  "BR",
  "NL",
  "PT",
  "US",
  "CA",
  "AR",
  "CL",
  "UY",
  "PY",
  "CO",
  "PE",
  "BO",
  "MX",
  "ES",
  "FR",
  "DE",
  "IT",
  "GB",
  "JP"
];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function looksLikeBrazilianNationalPhone(digits: string) {
  const subscriber = digits.slice(2);

  if (digits.length === 11) {
    return subscriber.startsWith("9");
  }

  if (digits.length === 10) {
    return /^[2-5]/.test(subscriber);
  }

  return false;
}

function parseWhatsappPhone(value: string, defaultCountry = DEFAULT_WHATSAPP_COUNTRY) {
  const trimmed = value.trim();
  const digits = digitsOnly(trimmed);

  if (!digits) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    return parsePhoneNumberFromString(`+${digits}`);
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return parsePhoneNumberFromString(`+${digits}`);
  }

  const defaultParsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  const internationalParsed = parsePhoneNumberFromString(`+${digits}`);

  if (
    defaultCountry === DEFAULT_WHATSAPP_COUNTRY &&
    defaultParsed?.isValid() &&
    looksLikeBrazilianNationalPhone(digits)
  ) {
    return defaultParsed;
  }

  if (
    internationalParsed?.isValid() &&
    internationalParsed.country &&
    internationalParsed.country !== defaultCountry
  ) {
    return internationalParsed;
  }

  return defaultParsed ?? internationalParsed;
}

function flagFromIso2(country: string) {
  return country
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(letter.charCodeAt(0) + 127397)
    );
}

function countryName(country: CountryCode, locale: string) {
  try {
    return (
      new Intl.DisplayNames([locale, "pt-BR"], { type: "region" }).of(country) ??
      country
    );
  } catch {
    return country;
  }
}

function formatNationalNumber(number: PhoneNumber) {
  return number.formatNational();
}

export function getWhatsappCountries(locale = "pt-BR"): WhatsappCountry[] {
  return getCountries()
    .map((country) => ({
      iso2: country,
      name: countryName(country, locale),
      dialCode: getCountryCallingCode(country),
      flag: flagFromIso2(country)
    }))
    .sort((first, second) => {
      const firstPreferred = PREFERRED_COUNTRIES.indexOf(first.iso2);
      const secondPreferred = PREFERRED_COUNTRIES.indexOf(second.iso2);

      if (firstPreferred !== -1 || secondPreferred !== -1) {
        return (
          (firstPreferred === -1 ? Number.MAX_SAFE_INTEGER : firstPreferred) -
          (secondPreferred === -1 ? Number.MAX_SAFE_INTEGER : secondPreferred)
        );
      }

      return first.name.localeCompare(second.name, locale);
    });
}

export function countryFromWhatsappInput(value: string): CountryCode {
  const parsed = parseWhatsappPhone(value);

  if (parsed?.country) {
    return parsed.country;
  }

  const digits = digitsOnly(value);
  const match = getCountries()
    .sort(
      (first, second) =>
        getCountryCallingCode(second).length - getCountryCallingCode(first).length
    )
    .find((country) => digits.startsWith(getCountryCallingCode(country)));

  return match ?? DEFAULT_WHATSAPP_COUNTRY;
}

export function countryCallingCode(country: CountryCode) {
  return getCountryCallingCode(country);
}

export function formatWhatsappNationalInput(
  value: string,
  country: CountryCode = DEFAULT_WHATSAPP_COUNTRY
) {
  const digits = digitsOnly(value).slice(0, 17);

  return digits ? new AsYouType(country).input(digits) : "";
}

export function whatsappPlaceholderForCountry(
  country: CountryCode = DEFAULT_WHATSAPP_COUNTRY
) {
  const example = getExampleNumber(country, examples);
  const nationalFormat = example?.formatNational();

  if (nationalFormat) {
    return nationalFormat.replace(/\d/g, "0");
  }

  const fallback = new AsYouType(country).input("0000000000");

  return fallback.replace(/\d/g, "0") || "0000000000";
}

export function nationalWhatsappInputFromValue(
  value: string,
  country: CountryCode = countryFromWhatsappInput(value)
) {
  const parsed = parseWhatsappPhone(value, country);

  if (parsed?.countryCallingCode === getCountryCallingCode(country)) {
    return formatWhatsappNationalInput(parsed.nationalNumber, country);
  }

  const digits = digitsOnly(value);
  const callingCode = getCountryCallingCode(country);
  const nationalDigits = digits.startsWith(callingCode)
    ? digits.slice(callingCode.length)
    : digits;

  return formatWhatsappNationalInput(nationalDigits, country);
}

export function buildWhatsappValue(
  country: CountryCode,
  nationalValue: string
) {
  const callingCode = getCountryCallingCode(country);
  const national = formatWhatsappNationalInput(nationalValue, country);

  return national ? `+${callingCode} ${national}` : `+${callingCode} `;
}

export function formatWhatsappInput(value: string) {
  const trimmed = value.trimStart();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return new AsYouType().input(`+${digitsOnly(trimmed).slice(0, 15)}`);
  }

  return buildWhatsappValue(DEFAULT_WHATSAPP_COUNTRY, trimmed).trimEnd();
}

export function normalizeBrazilianWhatsapp(value: string) {
  const parsed = parseWhatsappPhone(value);

  if (!parsed?.isPossible()) {
    throw new Error(
      "Informe um WhatsApp com DDI e numero validos. Ex.: +55 (91) 98258-5313."
    );
  }

  return parsed.number.replace(/\D/g, "");
}

export function normalizeWhatsappForSubmit(value: string) {
  const parsed = parseWhatsappPhone(value);

  return parsed?.isPossible() ? parsed.number.replace(/\D/g, "") : value.trim();
}

export function formatBrazilianWhatsapp(normalized: string) {
  const digits = digitsOnly(normalized);
  const parsed = parsePhoneNumberFromString(`+${digits}`);

  if (!parsed) {
    return digits ? `+${digits}` : "";
  }

  return `+${parsed.countryCallingCode} ${formatNationalNumber(parsed)}`.trim();
}

export function maskBrazilianWhatsapp(normalized: string) {
  const formatted = formatBrazilianWhatsapp(normalized);
  const lastFour = digitsOnly(normalized).slice(-4);

  if (!formatted || !lastFour) {
    return "";
  }

  const visiblePrefix = formatted.split(" ")[0];

  return `${visiblePrefix} *****-${lastFour}`;
}
