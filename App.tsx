import React, { useState } from 'react';
import { CurrencyCode, CurrencyDisplayMode, Product } from './types';
import { BulkUpload } from './components/BulkUpload';
import { BarcodeLabel } from './components/BarcodeLabel';
import { generatePDF } from './services/pdfGenerator';
import { CURRENCIES, formatProductPrice } from './utils/currency';
import { 
  Layout, 
  Download, 
  Trash2, 
  Printer, 
  Package,
  Coins
} from 'lucide-react';

const QUICK_CURRENCIES: CurrencyCode[] = ['PKR', 'USD', 'EUR', 'GBP'];

export default function App() {
  const [batches, setBatches] = useState<Record<string, Product[]>>({});
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('PKR');
  const [batchCurrencies, setBatchCurrencies] = useState<Record<string, CurrencyCode>>({});
  const [displayFormat, setDisplayFormat] = useState<'auto' | CurrencyDisplayMode>('auto');
  const [useConversion, setUseConversion] = useState(false);
  const [conversionRateInput, setConversionRateInput] = useState('1');

  const parsedRate = useConversion ? parseFloat(conversionRateInput) : 1;
  const effectiveRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 1;
  const resolvedDisplayMode = displayFormat === 'auto' ? undefined : displayFormat;

  const getBatchCurrency = (batchKey: string): CurrencyCode => {
    return batchCurrencies[batchKey] || currencyCode;
  };

  const handleGlobalCurrencyChange = (nextCode: CurrencyCode) => {
    setCurrencyCode(nextCode);
    // Reset per-sheet overrides so changing global currency updates all sheets predictably
    setBatchCurrencies({});
  };

  const handleBatchCurrencyChange = (batchKey: string, nextCode: CurrencyCode) => {
    setBatchCurrencies((prev) => ({
      ...prev,
      [batchKey]: nextCode,
    }));
  };

  const addBatches = (newBatches: Record<string, Product[]>) => {
    setBatches((prev) => {
      const updated = { ...prev };
      Object.entries(newBatches).forEach(([key, products]) => {
        if (updated[key]) {
          updated[key] = [...updated[key], ...products];
        } else {
          updated[key] = products;
        }
      });
      return updated;
    });
  };

  const removeProduct = (batchKey: string, id: string) => {
    setBatches((prev) => {
      const updated = { ...prev };
      updated[batchKey] = updated[batchKey].filter((p) => p.id !== id);
      if (updated[batchKey].length === 0) {
        delete updated[batchKey];
      }
      return updated;
    });
  };

  const clearBatch = (batchKey: string) => {
    if (confirm(`Are you sure you want to clear all items in "${batchKey}"?`)) {
      setBatches((prev) => {
        const updated = { ...prev };
        delete updated[batchKey];
        return updated;
      });
      setBatchCurrencies((prev) => {
        const updated = { ...prev };
        delete updated[batchKey];
        return updated;
      });
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all items from all sheets?')) {
      setBatches({});
      setBatchCurrencies({});
    }
  };

  const handleDownloadPDF = (batchKey: string) => {
    const products = batches[batchKey];
    if (!products || products.length === 0) return;
    generatePDF(products, {
      currencyCode: getBatchCurrency(batchKey),
      displayMode: resolvedDisplayMode,
      conversionRate: effectiveRate,
      batchName: batchKey,
    });
  };

  const batchKeys = Object.keys(batches);

  // Optimization: Only render the first 50 items in preview to prevent DOM freezing with large CSVs
  const PREVIEW_LIMIT = 50;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Printer size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Barcodify by Ali Razzaq</h1>
              <p className="text-xs text-slate-500 font-medium">Retail Label Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
              Currency: {currencyCode}
            </span>
            <span className="text-sm text-slate-500 hidden sm:inline">
              {batchKeys.length} {batchKeys.length === 1 ? 'Sheet' : 'Sheets'} loaded
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Input Section */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Form Area */}
            <div className="transition-all duration-300 ease-in-out">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Upload Data</h2>
                <BulkUpload onUpload={addBatches} />
              </div>
            </div>

            {/* Currency Settings */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Coins size={17} className="text-indigo-600" />
                  Label Currency
                </h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Preview: {formatProductPrice('2490', currencyCode, resolvedDisplayMode, effectiveRate)}
                </span>
              </div>

              {/* Quick Currency Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_CURRENCIES.map((code) => {
                  const option = CURRENCIES.find((c) => c.code === code)!;
                  const isActive = currencyCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleGlobalCurrencyChange(code)}
                      className={`px-2 py-2 rounded-lg border text-center transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <div className="text-sm font-bold leading-tight">
                        {option.symbol === option.code ? option.code : `${option.symbol} ${option.code}`}
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {option.name.split(' ').pop()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* All Currencies + Format Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    All Currencies
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => handleGlobalCurrencyChange(e.target.value as CurrencyCode)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Label Format
                  </label>
                  <select
                    value={displayFormat}
                    onChange={(e) => setDisplayFormat(e.target.value as 'auto' | CurrencyDisplayMode)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="auto">Auto ($, €, £, PKR)</option>
                    <option value="symbol">Symbol ($ / € / £)</option>
                    <option value="code">Code (USD / EUR / GBP)</option>
                  </select>
                </div>
              </div>

              {/* Optional Price Conversion Multiplier */}
              <div className="pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useConversion}
                    onChange={(e) => setUseConversion(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Convert uploaded prices using an exchange rate
                </label>

                {useConversion && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Multiply price by:</span>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={conversionRateInput}
                      onChange={(e) => setConversionRateInput(e.target.value)}
                      placeholder="e.g. 0.0036"
                      className="w-28 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">
                      (1 = no change)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions / Info */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                <Layout size={18} />
                Output Layout
              </h3>
              <p className="text-sm text-indigo-700/80 leading-relaxed">
                The generated PDF will follow a 2x7 grid layout (14 labels per A4 page).
                This wider layout prevents barcode truncation.
                Label size approx 96mm x 36mm.
              </p>
            </div>
          </div>

          {/* Right Column: Preview Section */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                Print Queues
              </h2>
              {batchKeys.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            {/* List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
              {batchKeys.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Layout size={32} className="opacity-50" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">Queue is empty</p>
                  <p className="text-sm max-w-xs text-center mt-2">Upload a CSV or Excel file to generate your barcodes.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {batchKeys.map((batchKey) => {
                    const products = batches[batchKey];
                    const displayProducts = products.slice(0, PREVIEW_LIMIT);
                    const hiddenCount = Math.max(0, products.length - PREVIEW_LIMIT);
                    const batchCurrency = getBatchCurrency(batchKey);

                    return (
                      <div key={batchKey} className="border-b border-slate-100 last:border-0">
                        <div className="p-4 bg-slate-50/80 flex flex-wrap gap-2 justify-between items-center sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{batchKey}</h3>
                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                              {products.length} items
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Currency for ${batchKey}`}
                              value={batchCurrency}
                              onChange={(e) => handleBatchCurrencyChange(batchKey, e.target.value as CurrencyCode)}
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.symbol})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => clearBatch(batchKey)}
                              className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center gap-1 p-1.5 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                              Clear
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(batchKey)}
                              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            >
                              <Download size={14} />
                              Export {batchKey} PDF
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-white">
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {displayProducts.map((product) => (
                              <div key={product.id} className="relative group">
                                <BarcodeLabel
                                  product={product}
                                  currencyCode={batchCurrency}
                                  displayMode={resolvedDisplayMode}
                                  conversionRate={effectiveRate}
                                />
                                <button
                                  onClick={() => removeProduct(batchKey, product.id)}
                                  className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                                  title="Remove item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          {hiddenCount > 0 && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center shadow-sm">
                              <p className="text-amber-800 font-semibold text-sm">
                                Preview limited to first {PREVIEW_LIMIT} items
                              </p>
                              <p className="text-amber-700 text-xs mt-1">
                                And {hiddenCount} more items. All {products.length} items will be included in the PDF export.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Footer Stat */}
              <div className="p-4 border-t border-slate-100 bg-white text-xs text-slate-500 flex justify-between items-center">
                <span>Total Items (All Sheets): {Object.values(batches).reduce((acc: number, b: Product[]) => acc + b.length, 0)}</span>
                <span>Format: Code 128 ({currencyCode})</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}