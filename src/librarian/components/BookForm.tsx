import { useState, useEffect, useRef } from "react";
import { AlertCircle, Camera, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { BarcodeScanner } from "../../components/ui/BarcodeScanner";

interface BookFormProps {
  editingBookId: string | number | null;
  formData: {
    isbn: string;
    title: string;
    author: string;
    status: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      isbn: string;
      title: string;
      author: string;
      status: string;
    }>
  >;
  actionError: string;
  isDark: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function BookForm({
  editingBookId,
  formData,
  setFormData,
  actionError,
  isDark,
  onSave,
  onCancel,
}: BookFormProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (formData.isbn && svgRef.current) {
      try {
        JsBarcode(svgRef.current, formData.isbn, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          background: isDark ? "#1e293b" : "#f8fafc",
          lineColor: isDark ? "#ffffff" : "#000000",
        });
      } catch (err) {
        console.error("Error generating barcode in form preview:", err);
      }
    }
  }, [formData.isbn, isDark]);

  useEffect(() => {
    if (formData.isbn) {
      QRCode.toDataURL(formData.isbn, {
        width: 150,
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
        console.error("Error generating QR code in form preview:", err);
      });
    } else {
      setQrDataUrl("");
    }
  }, [formData.isbn, isDark]);

  const handleScan = (decodedText: string) => {
    try {
      // Intentar ver si el texto escaneado es un objeto JSON de libro completo
      const parsed = JSON.parse(decodedText);
      if (parsed && typeof parsed === "object") {
        setFormData({
          isbn: parsed.isbn || parsed.code || formData.isbn || "",
          title: parsed.title || parsed.titulo || formData.title || "",
          author: parsed.author || parsed.autor || formData.author || "",
          status: parsed.status || formData.status || "Disponible",
        });
      } else {
        setFormData({ ...formData, isbn: decodedText });
      }
    } catch (e) {
      // Si no es JSON, asumimos que es el código de barras/ISBN crudo
      setFormData({ ...formData, isbn: decodedText });
    }
    setShowScanner(false);
  };

  const handlePrint = async () => {
    if (!formData.isbn) return;
    
    let printQrUrl = "";
    try {
      printQrUrl = await QRCode.toDataURL(formData.isbn, {
        width: 120, // Smaller size so both fit
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        }
      });
    } catch (err) {
      console.error("Error creating printable QR code:", err);
      return;
    }

    const printSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(printSvgElement, formData.isbn, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 11,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (err) {
      console.error("Error creating printable barcode:", err);
    }
    const barcodeSvg = printSvgElement.outerHTML || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para poder imprimir el código QR.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Código QR - ${formData.title || "Nuevo Libro"}</title>
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
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 4px;
            }
            .barcode-container img {
              max-width: 100%;
              height: auto;
            }
            .barcode-container svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <h1 class="title">${formData.title || "Sin título"}</h1>
            <p class="author">${formData.author || "Autor Desconocido"}</p>
            <div class="barcode-container">
              ${barcodeSvg}
              <img src="${printQrUrl}" alt="QR Code" />
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
    <div
      className={`p-6 rounded-lg border mb-6 transition-colors ${
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#1E3A5F]"}`}>
        {editingBookId ? "Editar Registro" : "Registrar Nuevo Libro"}
      </h2>

      {actionError && (
        <div
          className={`flex gap-3 items-start p-3 rounded-lg mb-4 border ${
            isDark
              ? "bg-red-900/20 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{actionError}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              ISBN / Código de Barras
            </label>
            <div className="flex gap-2">
              <input
                id="isbn-input"
                type="text"
                placeholder="ISBN"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                  isDark
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Escanear Código para rellenar ISBN"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Título
            </label>
            <input
              type="text"
              placeholder="Título del Libro"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Autor
            </label>
            <input
              type="text"
              placeholder="Autor del Libro"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Estado de Disponibilidad
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-600 text-white focus:border-blue-500 focus:outline-none"
                  : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:outline-none"
              }`}
            >
              <option>Disponible</option>
              <option>Prestado</option>
              <option>Eliminado</option>
              <option>Extraviado</option>
            </select>
          </div>
        </div>

        {/* Panel del Generador de Código de Barras dentro del Formulario */}
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
          isDark ? "bg-slate-800/40 border-slate-700/60" : "bg-slate-50 border-slate-100"
        }`}>
          {formData.isbn ? (
            <div className="text-center space-y-4 w-full flex flex-col items-center">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Códigos Autogenerados
              </span>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 max-w-full overflow-hidden flex flex-col items-center gap-4">
                <svg ref={svgRef}></svg>
                {qrDataUrl && <img src={qrDataUrl} alt="Código QR" className="w-28 h-28 object-contain" />}
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 w-full max-w-[240px] px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all"
              >
                <Printer size={16} />
                Imprimir Etiqueta
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-400 p-6 space-y-2">
              <QrCode size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Códigos en tiempo real</p>
              <p className="text-xs max-w-[220px]">
                Introduce o escanea un ISBN para generar el QR y Código de Barras del libro.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onSave}
          className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-all shadow-sm"
        >
          Guardar Libro
        </button>
        <button
          onClick={onCancel}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
            isDark
              ? "bg-slate-700 text-white hover:bg-slate-600"
              : "bg-slate-200 text-slate-900 hover:bg-slate-300"
          }`}
        >
          Cancelar
        </button>
      </div>

      {/* Modal de escaneo flotante en el Formulario */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
