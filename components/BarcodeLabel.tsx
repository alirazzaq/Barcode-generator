import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { CurrencyCode, CurrencyDisplayMode, Product } from '../types';
import { formatProductPrice } from '../utils/currency';

interface BarcodeLabelProps {
  product: Product;
  currencyCode?: CurrencyCode;
  displayMode?: CurrencyDisplayMode;
  conversionRate?: number;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  product,
  currencyCode = 'PKR' as CurrencyCode,
  displayMode,
  conversionRate = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, product.sku, {
          format: 'CODE128',
          displayValue: false,
          height: 40,
          width: 2,
          margin: 0,
          background: 'transparent'
        });
      } catch (e) {
        console.error("Invalid SKU for barcode generation");
      }
    }
  }, [product.sku]);

  const formattedPrice = formatProductPrice(product.price, currencyCode, displayMode, conversionRate);
  const metaParts = [product.size, product.color].filter((part) => part && part.trim() !== '');

  return (
    <div className="w-[280px] h-[140px] bg-white border border-gray-200 shadow-sm rounded-md p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-300 transition-colors">
      {/* Article Name */}
      <div className="text-center w-full px-2 mb-1">
        <h3 className="font-bold text-gray-900 text-sm uppercase leading-tight line-clamp-2">
          {product.articleName}
        </h3>
      </div>

      {/* Size, Color, Price */}
      <div className="text-xs text-gray-600 mb-2 font-medium whitespace-nowrap">
        {metaParts.map((part, idx) => (
          <React.Fragment key={idx}>
            {part}
            <span className="mx-1.5 text-gray-400">•</span>
          </React.Fragment>
        ))}
        <span className="font-semibold text-slate-800">{formattedPrice}</span>
      </div>

      {/* Barcode */}
      <div className="w-full flex justify-center mb-1">
        <canvas ref={canvasRef} className="h-10 w-auto max-w-full" />
      </div>

      {/* SKU */}
      <div className="text-sm font-mono font-bold text-gray-800 tracking-wider">
        {product.sku}
      </div>
    </div>
  );
};