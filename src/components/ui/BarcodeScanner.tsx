import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrReaderId = "qr-reader";
    const html5Qrcode = new Html5Qrcode(qrReaderId);
    html5QrcodeRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            // Detener la cámara al detectar con éxito
            html5Qrcode.stop().then(() => {
              onScan(decodedText);
            }).catch((err) => {
              console.error("Error stopping scanner after success:", err);
              onScan(decodedText);
            });
          },
          () => {
            // Ignorar errores continuos de frames
          }
        );
      } catch (err: any) {
        console.error("Error starting camera:", err);
        setHasError(true);
        setErrorMessage(
          err?.message || "No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios."
        );
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch((err) => console.error("Error stopping scanner in cleanup:", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Estilos locales para la animación láser roja del escáner */}
      <style>{`
        @keyframes laser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold mb-4">
          Escáner de Código
        </h3>
        
        {hasError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <CameraOff size={48} className="text-red-500" />
            <p className="text-sm text-slate-300 px-4">{errorMessage}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Cerrar Escáner
            </button>
          </div>
        ) : (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-inner bg-black flex justify-center items-center aspect-square">
            <div id="qr-reader" className="w-full h-full object-cover"></div>
            
            {/* Superposición de mira de escaneo premium */}
            <div className="absolute inset-0 border-[3px] border-transparent pointer-events-none flex items-center justify-center">
              <div className="w-[70%] h-[70%] border border-white/20 rounded-xl relative shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                {/* Esquinas iluminadas */}
                <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl-lg"></div>
                <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-blue-500 rounded-br-lg"></div>
                
                {/* Láser rojo animado */}
                <div 
                  className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_red] top-0"
                  style={{ animation: "laser 2s infinite linear" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-sm text-slate-400 mt-4 text-center font-medium">
          Apunta la cámara trasera hacia un código QR o de barras.
        </p>
      </div>
    </div>
  );
}
