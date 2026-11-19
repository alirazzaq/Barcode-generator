export interface Product {
  id: string;
  articleName: string;
  sku: string;
  price: string;
  size: string;
  color: string;
}

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'CAD' | 'AUD';

export type CurrencyDisplayMode = 'symbol' | 'code';

export interface CurrencyOption {
  code: CurrencyCode;
  name: string;
  symbol: string;
  defaultDisplay: CurrencyDisplayMode;
}
