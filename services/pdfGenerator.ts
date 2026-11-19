import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { CurrencyCode, CurrencyDisplayMode, Product } from '../types';
import { formatProductPrice } from '../utils/currency';

export interface PDFGeneratorOptions {
  currencyCode?: CurrencyCode;
  displayMode?: CurrencyDisplayMode;
  conversionRate?: number;
  batchName?: string;
}

// Helper to generate a base64 barcode image
const generateBarcodeBase64 = (sku: string): string => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, sku, {
    format: 'CODE128',
    displayValue: false, // We will draw the text manually in the PDF for better control
    margin: 0,
    height: 40,
    width: 2,
    fontSize: 0,
  });
  return canvas.toDataURL('image/jpeg');
};

export const generatePDF = (products: Product[], options: PDFGeneratorOptions = {}) => {
  const {
    currencyCode = 'PKR',
    displayMode,
    conversionRate = 1,
    batchName,
  } = options;

  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  
  // New Configuration: 2 Columns, 7 Rows (14 per page)
  const cols = 2;
  const rows = 7;
  const labelWidth = 96; 
  const labelHeight = 36;
  const gutterX = 4; 
  const gutterY = 2;

  // Calculate margins to center the grid
  const totalGridWidth = (cols * labelWidth) + ((cols - 1) * gutterX);
  const marginX = (pageWidth - totalGridWidth) / 2;
  const marginY = 12; // Fixed top margin often safer for printers

  let colIndex = 0;
  let rowIndex = 0;

  products.forEach((product, index) => {
    // Check if new page is needed
    if (index > 0 && index % (cols * rows) === 0) {
      doc.addPage();
      colIndex = 0;
      rowIndex = 0;
    }

    const x = marginX + colIndex * (labelWidth + gutterX);
    const y = marginY + rowIndex * (labelHeight + gutterY);

    // --- Draw Label Border (Optional, helpful for cutting if not using pre-cut paper) ---
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(x, y, labelWidth, labelHeight);

    // --- Content ---
    const centerX = x + (labelWidth / 2);
    
    // 1. Article Name (Top)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Truncate text if too long
    const name = product.articleName.toUpperCase();
    const splitName = doc.splitTextToSize(name, labelWidth - 6);
    
    // If name is too long, just take first 2 lines
    const linesToPrint = splitName.length > 2 ? splitName.slice(0, 2) : splitName;
    doc.text(linesToPrint, centerX, y + 6, { align: "center" });
    
    let currentY = y + 6 + (linesToPrint.length * 4); // Adjust Y based on lines

    // 2. Size & Color & Price (Middle) - Combined Line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const formattedPrice = formatProductPrice(product.price, currencyCode, displayMode, conversionRate);
    const metaParts = [product.size, product.color, formattedPrice].filter((part) => part && part.trim() !== '');
    const metaText = metaParts.join(' • ');
    
    doc.text(metaText, centerX, currentY, { align: "center" });
    
    currentY += 2; // Spacer

    // 3. Barcode (Center)
    try {
      const barcodeData = generateBarcodeBase64(product.sku);
      // Wider barcode area for 2-column layout
      const barcodeWidth = 50;
      const barcodeHeight = 10;
      doc.addImage(barcodeData, 'JPEG', centerX - (barcodeWidth / 2), currentY, barcodeWidth, barcodeHeight);
      
      currentY += barcodeHeight + 4; // Move below barcode
    } catch (e) {
      console.error("Error generating barcode for", product.sku, e);
    }

    // 4. SKU (Bottom)
    doc.setFont("courier", "bold"); // Monospace looks nice for SKU
    doc.setFontSize(10);
    doc.text(product.sku, centerX, currentY, { align: "center" });

    // Increment Grid Position
    colIndex++;
    if (colIndex >= cols) {
      colIndex = 0;
      rowIndex++;
    }
  });

  const safeBatch = batchName ? `${batchName.replace(/[^a-z0-9_-]/gi, '_')}_` : '';
  doc.save(`barcodes_${safeBatch}${currencyCode}_${new Date().toISOString().slice(0, 10)}.pdf`);
};