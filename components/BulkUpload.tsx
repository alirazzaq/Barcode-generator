import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface BulkUploadProps {
  onUpload: (products: Product[]) => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Errors:", results.errors);
          setError('Error parsing CSV. Please check the format.');
          return;
        }

        const parsedProducts: Product[] = results.data.map((row: any) => {
          // Robust mapping for varying header names
          return {
            id: crypto.randomUUID(),
            articleName: row['article name'] || row['name'] || row['article'] || 'Unknown Item',
            sku: row['sku'] || row['id'] || '0000',
            price: row['price'] || row['cost'] || '0',
            size: row['size'] || '-',
            color: row['color'] || row['colour'] || '-',
          };
        }).filter(p => p.sku !== '0000'); // Filter out empty rows if any

        if (parsedProducts.length === 0) {
            setError("No valid products found. Ensure headers are: Article Name, SKU, Price, Size, Color.");
        } else {
            onUpload(parsedProducts);
            setSuccessMsg(`Successfully processed ${parsedProducts.length} items.`);
        }
      },
      error: (err) => {
        setError(`Failed to read file: ${err.message}`);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-xl p-10 hover:border-indigo-500 hover:bg-slate-50 transition-all cursor-pointer group"
      >
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload className="text-indigo-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Click to upload CSV</h3>
        <p className="text-sm text-slate-500 mb-6">
          Headers required: Article Name, SKU, Price, Size, Color
        </p>
        <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">
          Select File
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />

      <div className="mt-6 w-full max-w-md bg-slate-50 p-4 rounded-lg text-left">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Example CSV Format</h4>
        <div className="font-mono text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded">
          Article Name, SKU, Price, Size, Color<br/>
          Cotton Tee, CT100-BLK, 19.99, M, Black<br/>
          Denim Jeans, DJ500-BLU, 49.99, 32, Dark Wash
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
            <AlertCircle size={16} />
            {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            {successMsg}
        </div>
      )}
    </div>
  );
};