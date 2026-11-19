import { CurrencyCode, CurrencyDisplayMode, CurrencyOption } from '../types';

export const CURRENCIES: CurrencyOption[] = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR', defaultDisplay: 'code' },
  { code: 'USD', name: 'US Dollar', symbol: '$', defaultDisplay: 'symbol' },
  { code: 'EUR', name: 'Euro', symbol: '€', defaultDisplay: 'symbol' },
  { code: 'GBP', name: 'British Pound', symbol: '£', defaultDisplay: 'symbol' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', defaultDisplay: 'code' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', defaultDisplay: 'code' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', defaultDisplay: 'symbol' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', defaultDisplay: 'symbol' },
];

export const getCurrencyOption = (code: CurrencyCode): CurrencyOption => {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
};

export function formatProductPrice(
  rawPriceInput: string,
  currencyCode: CurrencyCode,
  displayMode?: CurrencyDisplayMode,
  conversionRate: number = 1
): string {
  const currency = getCurrencyOption(currencyCode);
  const mode = displayMode ?? currency.defaultDisplay;

  const cleaned = rawPriceInput
    ? rawPriceInput.toString().replace(/,/g, '').replace(/[^0-9.]/g, '')
    : '0';
  const parsed = parseFloat(cleaned);

  let formattedNumber: string;
  if (isNaN(parsed)) {
    formattedNumber = cleaned || '0';
  } else {
    const validRate = Number.isFinite(conversionRate) && conversionRate > 0 ? conversionRate : 1;
    const effectiveValue = validRate !== 1 ? parsed * validRate : parsed;
    const hasDecimalInSource = cleaned.includes('.') && validRate === 1;
    const isFractional = Math.abs(effectiveValue % 1) > 0.0001;

    if (validRate !== 1) {
      formattedNumber = effectiveValue.toLocaleString('en-US', {
        minimumFractionDigits: isFractional ? 2 : 0,
        maximumFractionDigits: 2,
      });
    } else if (hasDecimalInSource) {
      const decimalPart = cleaned.split('.')[1] || '';
      const minDigits = Math.min(decimalPart.length, 2);
      formattedNumber = effectiveValue.toLocaleString('en-US', {
        minimumFractionDigits: minDigits,
        maximumFractionDigits: 2,
      });
    } else {
      formattedNumber = effectiveValue.toLocaleString('en-US');
    }
  }

  const prefix = mode === 'code' ? currency.code : currency.symbol;
  const needsSpace = /^[A-Za-z]+$/.test(prefix);
  return needsSpace ? `${prefix} ${formattedNumber}` : `${prefix}${formattedNumber}`;
}
