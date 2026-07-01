"use client";

import { useEffect, useMemo, useState } from "react";
import type { CountryCode } from "libphonenumber-js/min";
import {
  buildWhatsappValue,
  countryCallingCode,
  countryFromWhatsappInput,
  DEFAULT_WHATSAPP_COUNTRY,
  DEFAULT_WHATSAPP_PREFIX,
  formatWhatsappInput,
  getWhatsappCountries,
  nationalWhatsappInputFromValue,
  normalizeWhatsappForSubmit,
  whatsappPlaceholderForCountry
} from "@/lib/phone";

type WhatsappInputProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function WhatsappInput({
  name,
  value,
  defaultValue = DEFAULT_WHATSAPP_PREFIX,
  onValueChange,
  required,
  disabled,
  placeholder,
  className = ""
}: WhatsappInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryFromWhatsappInput(defaultValue)
  );
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const currentValue = value ?? internalValue;
  const countries = useMemo(() => getWhatsappCountries("pt-BR"), []);
  const currentCountry =
    countries.find((country) => country.iso2 === selectedCountry) ??
    countries.find((country) => country.iso2 === DEFAULT_WHATSAPP_COUNTRY) ??
    countries[0];
  const nationalValue = nationalWhatsappInputFromValue(
    currentValue,
    selectedCountry
  );
  const inputPlaceholder =
    placeholder ?? whatsappPlaceholderForCountry(selectedCountry);
  const filteredCountries = useMemo(() => {
    const search = normalizeSearch(countrySearch);
    const searchDigits = countrySearch.replace(/\D/g, "");

    if (!search && !searchDigits) {
      return countries;
    }

    return countries.filter((country) => {
      const name = normalizeSearch(country.name);

      return (
        name.includes(search) ||
        country.iso2.toLowerCase().includes(search) ||
        country.dialCode.includes(searchDigits)
      );
    });
  }, [countries, countrySearch]);

  useEffect(() => {
    setSelectedCountry(countryFromWhatsappInput(currentValue));
  }, [currentValue]);

  function emit(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleNationalChange(nextNationalValue: string) {
    emit(buildWhatsappValue(selectedCountry, nextNationalValue));
  }

  function handleManualInternational(valueFromClipboard: string) {
    const formatted = formatWhatsappInput(valueFromClipboard);

    if (formatted.startsWith("+")) {
      emit(formatted);
    } else {
      handleNationalChange(valueFromClipboard);
    }
  }

  function selectCountry(country: CountryCode) {
    setSelectedCountry(country);
    emit(`+${countryCallingCode(country)} `);
    setCountrySearch("");
    setCountryModalOpen(false);
  }

  return (
    <div className={`grid gap-2 ${className}`}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={normalizeWhatsappForSubmit(currentValue)}
        />
      ) : null}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          type="button"
          onClick={() => setCountryModalOpen(true)}
          disabled={disabled}
          className="h-10 rounded-md border border-line bg-mist px-3 text-sm font-black text-field transition hover:border-field disabled:text-coal/35 sm:h-11"
          aria-label="Escolher país do WhatsApp"
        >
          {currentCountry.flag} +{currentCountry.dialCode}
        </button>
        <input
          value={nationalValue}
          onChange={(event) => handleNationalChange(event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");

            if (pasted.trim().startsWith("+")) {
              event.preventDefault();
              handleManualInternational(pasted);
            }
          }}
          placeholder={inputPlaceholder}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          disabled={disabled}
          className="h-10 min-w-0 rounded-md border border-line px-3 text-base font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 disabled:bg-mist disabled:text-coal/45 sm:h-11 sm:text-sm"
        />
      </div>
      <p className="text-[11px] font-semibold text-coal/55">
        País selecionado: {currentCountry.name} (+{currentCountry.dialCode}).
        Para outro país, toque no código.
      </p>

      {countryModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="country-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <div className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="country-dialog-title" className="text-lg font-semibold text-ink">
                  Escolher país
                </h2>
                <p className="mt-1 text-sm text-coal/70">
                  O país define o DDI e o formato do WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCountryModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-lg font-semibold text-coal transition hover:border-field hover:text-field"
                aria-label="Fechar seleção de país"
              >
                ×
              </button>
            </div>

            <input
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Buscar país ou DDI"
              className="mt-4 h-10 w-full rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
            />

            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-line">
              {filteredCountries.map((country) => (
                <button
                  key={`${country.iso2}-${country.dialCode}`}
                  type="button"
                  onClick={() => selectCountry(country.iso2)}
                  className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-3 text-left text-sm font-semibold text-ink last:border-b-0 hover:bg-mist"
                >
                  <span className="min-w-0">
                    <span className="mr-2 text-lg">{country.flag}</span>
                    {country.name}
                  </span>
                  <span className="shrink-0 rounded-md bg-field/10 px-2 py-1 text-xs font-black text-field">
                    +{country.dialCode}
                  </span>
                </button>
              ))}
              {filteredCountries.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm font-semibold text-coal/60">
                  País não encontrado. Cole o número completo com +DDI no campo.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setCountryModalOpen(false)}
              className="mt-4 h-10 w-full rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-field hover:text-field"
            >
              Voltar ao número
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
