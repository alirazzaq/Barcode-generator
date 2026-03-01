import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Product } from '../types';

interface BulkUploadProps {
  onUpload: (batches: Record<string, Product[]>) => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractSize = (sku: string): string => {
    const parts = sku.toUpperCase().split("-");
    for (const part of parts) {
      const trimmed = part.trim();
      // Numeric sizes (26,28,30,32,34,36...)
      if (/^\d{2,3}$/.test(trimmed)) {
        return trimmed;
      }
      // Letter sizes (XS,S,M,L,XL,XXL,XXXL)
      if (/^(XS|S|M|L|XL|XXL|XXXL)$/.test(trimmed)) {
        return trimmed;
      }
    }
    return "";
  };

  const processExcel = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const batches: Record<string, Product[]> = {};
      let totalItems = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) continue;

        // Clean Column Names (Strip and Upper)
        const cleanedData = jsonData.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            newRow[key.trim().toUpperCase()] = row[key];
          });
          return newRow;
        });

        const firstRow = cleanedData[0];
        const columns = Object.keys(firstRow);

        // Auto-detect Retail Price Column
        const priceCol = columns.find(c => c.includes("RETAIL"));
        if (!priceCol) continue; // Skip sheets without price column

        if (!columns.includes("ARTICLE NAME")) continue; // Skip sheets without article name

        // Forward Fill Article Name and Process Data
        let lastArticleName = "";
        const rows: Product[] = [];
        const seenSkus = new Set<string>();

        cleanedData.forEach((row: any) => {
          const articleName = row["ARTICLE NAME"] ? String(row["ARTICLE NAME"]).trim() : lastArticleName;
          if (row["ARTICLE NAME"]) lastArticleName = articleName;

          const skuCell = row["COLOUR CODES"];
          if (!skuCell) return;

          // Split multiple SKUs by comma, newline or extra spaces
          const skuList = String(skuCell).split(/,|\n|\s{2,}/);

          skuList.forEach(sku => {
            const trimmedSku = sku.trim();
            if (!trimmedSku || seenSkus.has(trimmedSku)) return;

            seenSkus.add(trimmedSku);
            rows.push({
              id: crypto.randomUUID(),
              articleName: articleName,
              sku: trimmedSku,
              price: String(row[priceCol] || ""),
              size: extractSize(trimmedSku),
              color: String(row["COLOUR NAME"] || "").trim()
            });
          });
        });

        // Sort by Article Name and Size (numeric sort if possible)
        rows.sort((a, b) => {
          if (a.articleName !== b.articleName) {
            return a.articleName.localeCompare(b.articleName);
          }
          const sizeA = parseInt(a.size) || 0;
          const sizeB = parseInt(b.size) || 0;
          if (sizeA !== sizeB) return sizeA - sizeB;
          return a.size.localeCompare(b.size);
        });

        if (rows.length > 0) {
          batches[sheetName] = rows;
          totalItems += rows.length;
        }
      }

      if (Object.keys(batches).length === 0) {
        throw new Error("No valid products found in any sheet. Ensure headers are: ARTICLE NAME, COLOUR CODES, and a column with RETAIL.");
      }

      onUpload(batches);
      setSuccessMsg(`Successfully processed ${totalItems} items from ${Object.keys(batches).length} sheets.`);
    } catch (err: any) {
      setError(err.message || "Failed to process Excel file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');

    if (isExcel) {
      processExcel(file);
    } else if (isCsv) {
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
            return {
              id: crypto.randomUUID(),
              articleName: row['article name'] || row['name'] || row['article'] || 'Unknown Item',
              sku: row['sku'] || row['id'] || '0000',
              price: row['price'] || row['cost'] || '0',
              size: row['size'] || '-',
              color: row['color'] || row['colour'] || '-',
            };
          }).filter(p => p.sku !== '0000');

          if (parsedProducts.length === 0) {
              setError("No valid products found. Ensure headers are: Article Name, SKU, Price, Size, Color.");
          } else {
              onUpload({ "Default": parsedProducts });
              setSuccessMsg(`Successfully processed ${parsedProducts.length} items.`);
          }
        },
        error: (err) => {
          setError(`Failed to read file: ${err.message}`);
        }
      });
    } else {
      setError('Please upload a valid CSV or Excel file.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`w-full max-w-md border-2 border-dashed border-slate-300 rounded-xl p-10 transition-all cursor-pointer group ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:bg-slate-50'
        }`}
      >
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          ) : (
            <Upload className="text-indigo-600" size={32} />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {isProcessing ? 'Processing...' : 'Click to upload CSV or Excel'}
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Supports .csv, .xlsx, and .xls files
        </p>
        <button 
          disabled={isProcessing}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          Select File
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv, .xlsx, .xls" 
        className="hidden" 
      />

      <div className="mt-6 w-full max-w-md bg-slate-50 p-4 rounded-lg text-left">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Excel Requirements</h4>
        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
          <li>Must have <span className="font-semibold">ARTICLE NAME</span> column (auto-fills empty rows)</li>
          <li>Must have <span className="font-semibold">COLOUR CODES</span> column (SKUs)</li>
          <li>Must have a column containing <span className="font-semibold">RETAIL</span> (Price)</li>
          <li>Optional: <span className="font-semibold">COLOUR NAME</span></li>
        </ul>
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
