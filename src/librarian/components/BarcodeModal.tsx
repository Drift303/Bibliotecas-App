import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { X, Printer } from "lucide-react";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    isbn: string;
    title: string;
    author: string;
  };
  isDark: boolean;
}

export function BarcodeModal({ isOpen, onClose, book, isDark }: BarcodeModalProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (isOpen && svgRef.current && book.isbn) {
      try {
        JsBarcode(svgRef.current, book.isbn, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          background: isDark ? "#1e293b" : "#ffffff",
          lineColor: isDark ? "#ffffff" : "#000000",
        });
      } catch (err) {
        console.error("Error generating barcode:", err);
      }
    }
  }, [book.isbn, isOpen, isDark]);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Para la impresión siempre usamos fondo blanco y líneas negras para que sea legible
    const printSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(printSvgElement, book.isbn, {
        format: "CODE128",
        width: 2,
        height: 65,
        displayValue: true,
        fontSize: 14,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (err) {
      console.error("Error creating printable barcode:", err);
    }
    const barcodeSvg = printSvgElement.outerHTML || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para poder imprimir el código de barras.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Código de Barras - ${book.title}</title>
          <style>
            @page {
              size: 60mm 60mm;
              margin: 0;
            }
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 10px;
              height: 100vh;
              box-sizing: border-box;
            }
            .label-container {
              text-align: center;
              border: 1px dashed #ccc;
              border-radius: 8px;
              padding: 10px;
              width: 100%;
              max-width: 200px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .title {
              font-size: 11px;
              font-weight: bold;
              margin: 0 0 2px 0;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 180px;
              color: #1a1a1a;
            }
            .author {
              font-size: 9px;
              color: #555;
              margin: 0 0 8px 0;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 180px;
            }
            .barcode-container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <h1 class="title">${book.title}</h1>
            <p class="author">${book.author}</p>
            <div class="barcode-container">
              ${barcodeSvg}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-800 text-white"
          : "bg-white border-slate-200 text-slate-900"
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4">
          Etiqueta de Código de Barras
        </h3>

        <div className={`flex flex-col items-center p-6 rounded-2xl mb-6 border ${
          isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="text-center w-full mb-6">
            <h4 className="font-semibold text-lg truncate px-2">{book.title}</h4>
            <p className={`text-sm truncate px-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{book.author}</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 w-full flex justify-center">
            <svg ref={svgRef}></svg>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-md shadow-blue-500/20"
          >
            <Printer size={18} />
            Imprimir Etiqueta
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-slate-800 text-white hover:bg-slate-700"
                : "bg-slate-200 text-slate-900 hover:bg-slate-300"
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
