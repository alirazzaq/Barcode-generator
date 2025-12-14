export interface Product {
  id: string;
  articleName: string;
  sku: string;
  price: string;
  size: string;
  color: string;
}

export type InputMode = 'single' | 'bulk';