import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';

interface BarcodeLabelProps {
  product: Product;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ product }) => {
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

  // Clean price and add thousand separator
  const rawPrice = product.price ? product.price.toString().replace(/,/g, '').replace(/[^0-9.]/g, '') : '0';
  const priceNum = parseFloat(rawPrice);
  const priceVal = isNaN(priceNum) ? rawPrice : priceNum.toLocaleString('en-US');

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
        {product.size} 
        <span className="mx-1.5 text-gray-400">•</span> 
        {product.color}
        <span className="mx-1.5 text-gray-400">•</span>
        <span className="font-semibold text-slate-800">PKR {priceVal}</span>
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