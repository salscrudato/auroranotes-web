/**
 * PhoneInput - International phone number input with country selector
 * Provides a seamless phone number entry experience with:
 * - Country code dropdown with flag emojis
 * - Auto-formatting for each country
 * - Real-time validation
 * - Mobile-optimized UX
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

// Common countries with their phone codes and formatting
const COUNTRIES = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', format: '(XXX) XXX-XXXX', maxDigits: 10 },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', format: '(XXX) XXX-XXXX', maxDigits: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', format: 'XXXX XXX XXXX', maxDigits: 10 },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', format: 'XXX XXX XXX', maxDigits: 9 },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', format: 'XXX XXXXXXXX', maxDigits: 11 },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', format: 'X XX XX XX XX', maxDigits: 9 },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', format: 'XXXXX XXXXX', maxDigits: 10 },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', format: 'XX XXXX XXXX', maxDigits: 10 },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', format: 'XXX XXX XXXX', maxDigits: 10 },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', format: 'XX XXXXX-XXXX', maxDigits: 11 },
] as const;

type Country = typeof COUNTRIES[number];

interface PhoneInputProps {
  value: string;
  onChange: (e164: string, formatted: string, isValid: boolean) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string | null;
}

export const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  error,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format phone number based on country
  const formatPhone = useCallback((digits: string, country: Country): string => {
    const format = country.format;
    let result = '';
    let digitIndex = 0;
    
    for (const char of format) {
      if (digitIndex >= digits.length) break;
      if (char === 'X') {
        result += digits[digitIndex];
        digitIndex++;
      } else {
        result += char;
      }
    }
    return result;
  }, []);

  // Extract digits and format
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    const formatted = formatPhone(digits, selectedCountry);
    setLocalValue(formatted);
    
    const e164 = digits.length >= 6 ? `${selectedCountry.dial}${digits}` : '';
    const isValid = digits.length === selectedCountry.maxDigits;
    onChange(e164, formatted, isValid);
  }, [selectedCountry, formatPhone, onChange]);

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setLocalValue('');
    onChange('', '', false);
    inputRef.current?.focus();
  }, [onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get validation status
  const digits = localValue.replace(/\D/g, '');
  const isValid = digits.length === selectedCountry.maxDigits;
  const hasContent = digits.length > 0;

  return (
    <div className="phone-input-wrapper">
      <div className={`phone-input-container ${error ? 'has-error' : ''} ${isValid ? 'is-valid' : ''}`}>
        {/* Country Selector */}
        <div className="phone-input-country" ref={dropdownRef}>
          <button
            type="button"
            className="phone-input-country-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={disabled}
            aria-label="Select country"
            aria-expanded={dropdownOpen}
          >
            <span className="phone-input-flag">{selectedCountry.flag}</span>
            <span className="phone-input-dial">{selectedCountry.dial}</span>
            <ChevronDown size={14} className={`phone-input-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="phone-input-dropdown" role="listbox">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={`phone-input-dropdown-item ${country.code === selectedCountry.code ? 'selected' : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  role="option"
                  aria-selected={country.code === selectedCountry.code}
                >
                  <span className="phone-input-flag">{country.flag}</span>
                  <span className="phone-input-country-name">{country.name}</span>
                  <span className="phone-input-dial">{country.dial}</span>
                  {country.code === selectedCountry.code && <Check size={14} className="phone-input-check" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="phone-input-field"
          placeholder={selectedCountry.format.replace(/X/g, '0')}
          value={localValue}
          onChange={handleInputChange}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? 'phone-error' : undefined}
        />

        {/* Validation Icon */}
        {hasContent && (
          <div className="phone-input-status">
            {isValid ? (
              <Check size={18} className="phone-input-valid" />
            ) : (
              <AlertCircle size={18} className="phone-input-invalid" />
            )}
          </div>
        )}
      </div>
      {error && <p id="phone-error" className="phone-input-error">{error}</p>}
    </div>
  );
});

