import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { X, Printer } from "lucide-react";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: {
    isbn: string;
    title: string;
    author: string;
  }[];
  isDark: boolean;
}

export function BarcodeModal({ isOpen, onClose, books, isDark }: BarcodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [codeFormat, setCodeFormat] = useState<"QR" | "BARCODE">("QR");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const previewBook = books && books.length > 0 ? books[0] : null;

  useEffect(() => {
    if (isOpen && svgRef.current && previewBook && previewBook.isbn) {
      try {
        JsBarcode(svgRef.current, previewBook.isbn, {
          format: "CODE128",
          width: 2.5,
          height: 70,
          displayValue: true,
          fontSize: 16,
          background: "transparent",
          lineColor: isDark ? "#ffffff" : "#000000",
        });
      } catch (err) {
        console.error("Error generating barcode:", err);
      }
    }
  }, [previewBook, isOpen, isDark]);

  useEffect(() => {
    if (isOpen && previewBook && previewBook.isbn) {
      QRCode.toDataURL(previewBook.isbn, {
        width: 250,
        margin: 1,
        color: {
          dark: isDark ? "#ffffff" : "#000000",
          light: isDark ? "#1e293b" : "#ffffff",
        }
      })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [previewBook, isOpen, isDark]);

  if (!isOpen || !previewBook) return null;

  const handlePrint = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para poder imprimir.");
      return;
    }

    let labelsHTML = "";

    for (const b of books) {
      let printQrUrl = "";
      try {
        printQrUrl = await QRCode.toDataURL(b.isbn, {
          width: 200,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" }
        });
      } catch (err) {}

      const printSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      try {
        JsBarcode(printSvgElement, b.isbn, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 0
        });
      } catch (err) {}
      const barcodeSvg = printSvgElement.outerHTML || "";

      const activeCodeHTML = codeFormat === "QR" 
        ? `<img src="${printQrUrl}" alt="QR Code" />` 
        : `${barcodeSvg}`;

      labelsHTML += `
        <div class="label-container">
          <h1 class="title">${b.title}</h1>
          <p class="author">${b.author}</p>
          <div class="barcode-container">
            ${activeCodeHTML}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Etiquetas</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(50mm, 1fr));
              gap: 5mm;
              justify-content: start;
            }
            .label-container {
              text-align: center;
              border: 1px dashed #ccc;
              padding: 5px;
              width: 50mm;
              height: 35mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .title {
              font-size: 9px;
              font-weight: bold;
              margin: 0 0 2px 0;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 48mm;
              color: #000;
            }
            .author {
              font-size: 7px;
              color: #333;
              margin: 0 0 4px 0;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 48mm;
            }
            .barcode-container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container img {
              max-width: 25mm;
              max-height: 25mm;
            }
            .barcode-container svg {
              max-width: 48mm;
              max-height: 15mm;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${labelsHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
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
          {books.length > 1 ? `Imprimir ${books.length} Etiquetas` : "Etiqueta del Libro"}
        </h3>

        <div className={`flex flex-col items-center p-6 rounded-2xl mb-6 border ${
          isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="text-center w-full mb-4">
            <h4 className="font-semibold text-lg truncate px-2">{previewBook.title}</h4>
            <p className={`text-sm truncate px-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{previewBook.author}</p>
            {books.length > 1 && (
              <p className={`text-xs mt-2 font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                (+ {books.length - 1} libros más)
              </p>
            )}
          </div>

          <div className={`flex gap-1 w-full p-1 rounded-lg mb-4 ${isDark ? "bg-slate-900/50" : "bg-slate-200/50"}`}>
            <button
              onClick={() => setCodeFormat("QR")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                codeFormat === "QR"
                  ? isDark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-800 shadow"
                  : isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              QR
            </button>
            <button
              onClick={() => setCodeFormat("BARCODE")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                codeFormat === "BARCODE"
                  ? isDark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-800 shadow"
                  : isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Barras
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 w-full overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
            <div className={codeFormat === "BARCODE" ? "block" : "hidden"}>
              <svg ref={svgRef}></svg>
            </div>
            <div className={codeFormat === "QR" ? "block" : "hidden"}>
              {qrDataUrl && <img src={qrDataUrl} alt="Código QR" className="w-48 h-48 object-contain" />}
            </div>
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
