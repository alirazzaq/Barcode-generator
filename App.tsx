import React, { useState } from 'react';
import { Product, InputMode } from './types';
import { InputForm } from './components/InputForm';
import { BulkUpload } from './components/BulkUpload';
import { BarcodeLabel } from './components/BarcodeLabel';
import { generatePDF } from './services/pdfGenerator';
import { 
  Layout, 
  FileSpreadsheet, 
  PenLine, 
  Download, 
  Trash2, 
  Printer, 
  Package
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<InputMode>('single');

  const addProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const addBulkProducts = (newProducts: Product[]) => {
    setProducts((prev) => [...newProducts, ...prev]);
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all items?')) {
      setProducts([]);
    }
  };

  const handleDownloadPDF = () => {
    if (products.length === 0) return;
    generatePDF(products);
  };

  // Optimization: Only render the first 50 items in preview to prevent DOM freezing with large CSVs
  const PREVIEW_LIMIT = 50;
  const displayProducts = products.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, products.length - PREVIEW_LIMIT);

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
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Barcodify Pro</h1>
              <p className="text-xs text-slate-500 font-medium">Retail Label Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2 hidden sm:inline">
              {products.length} {products.length === 1 ? 'Label' : 'Labels'} ready
            </span>
            <button
              onClick={handleDownloadPDF}
              disabled={products.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                products.length > 0 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Input Section */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Mode Switcher */}
            <div className="bg-slate-200/50 p-1 rounded-xl flex">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'single' 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenLine size={16} />
                Single Entry
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'bulk' 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet size={16} />
                Bulk CSV Upload
              </button>
            </div>

            {/* Form Area */}
            <div className="transition-all duration-300 ease-in-out">
              {mode === 'single' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Add Product</h2>
                  </div>
                  <InputForm onAdd={addProduct} />
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800">Upload Data</h2>
                  <BulkUpload onUpload={addBulkProducts} />
                </div>
              )}
            </div>

            {/* Instructions / Info */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                <Layout size={18} />
                Output Layout
              </h3>
              <p className="text-sm text-indigo-700/80 leading-relaxed">
                The generated PDF will follow a 2x8 grid layout (16 labels per A4 page).
                This wider layout prevents barcode truncation for longer SKUs. 
                Each label includes the item name, variant details, SKU barcode (Code 128), and price (PKR).
              </p>
            </div>
          </div>

          {/* Right Column: Preview Section */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                Print Queue
              </h2>
              {products.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Clear Queue
                </button>
              )}
            </div>

            {/* List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
              {products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Layout size={32} className="opacity-50" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">Queue is empty</p>
                  <p className="text-sm max-w-xs text-center mt-2">Add products manually or upload a CSV file to generate your barcodes.</p>
                </div>
              ) : (
                <div className="overflow-y-auto p-6 h-0 flex-1 bg-slate-50/50">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {displayProducts.map((product) => (
                      <div key={product.id} className="relative group">
                        <BarcodeLabel product={product} />
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Warning Banner for Large Lists */}
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
              )}
              
              {/* Footer Stat */}
              <div className="p-4 border-t border-slate-100 bg-white text-xs text-slate-500 flex justify-between items-center">
                <span>Total Items: {products.length}</span>
                <span>Format: Code 128 (PKR)</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}