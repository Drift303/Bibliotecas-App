import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

interface CredentialGeneratorProps {
  studentData: {
    name: string;
    studentId: string;
    department: string;
  };
  onGenerate: (base64Image: string) => void;
  isDark: boolean;
}

export function CredentialGenerator({ studentData, onGenerate, isDark }: CredentialGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [credentialGenerated, setCredentialGenerated] = useState(false);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setPhotoCaptured(null);
      setCredentialGenerated(false);
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara. Revisa los permisos de tu navegador.");
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Tomar foto
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhotoCaptured(dataUrl);
        stopCamera();
      }
    }
  };

  // Limpiar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Generar Credencial Completa
  const generateCredential = async () => {
    if (!photoCaptured || !studentData.studentId || !studentData.name) {
      alert("Se necesita la foto y los datos completos (Nombre, Matrícula) para generar la credencial.");
      return;
    }

    try {
      // 1. Generar Código QR en un canvas temporal
      const qrDataUrl = await QRCode.toDataURL(studentData.studentId, { margin: 1, width: 120 });

      // 2. Dibujar todo en el canvas final de la credencial
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = 400;
      finalCanvas.height = 250;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      // Fondo
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Barra superior (Diseño)
      ctx.fillStyle = "#1E3A5F";
      ctx.fillRect(0, 0, finalCanvas.width, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("CREDENCIAL DE BIBLIOTECA", finalCanvas.width / 2, 33);

      // Foto del alumno
      const photoImg = new Image();
      photoImg.src = photoCaptured;
      await new Promise((resolve) => { photoImg.onload = resolve; });
      
      // Calculate crop to make it portrait 3:4 if video is landscape
      let sx = 0; let sy = 0; let sw = photoImg.width; let sh = photoImg.height;
      if (photoImg.width > photoImg.height) {
        sw = photoImg.height * 0.75;
        sx = (photoImg.width - sw) / 2;
      }
      ctx.drawImage(photoImg, sx, sy, sw, sh, 20, 70, 100, 133);
      ctx.strokeStyle = "#1E3A5F";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 70, 100, 133);

      // Datos del alumno
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.font = "bold 18px Arial";
      const displayName = studentData.name.length > 25 ? studentData.name.substring(0, 25) + "..." : studentData.name;
      ctx.fillText(displayName, 140, 95);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#4A5568";
      ctx.fillText("Matrícula: " + studentData.studentId, 140, 120);
      ctx.fillText("Depto: " + (studentData.department || "General"), 140, 145);

      // Código QR
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => { qrImg.onload = resolve; });
      ctx.drawImage(qrImg, 140, 160, 80, 80);

      // Texto
      ctx.font = "10px Arial";
      ctx.fillStyle = "#A0AEC0";
      ctx.textAlign = "center";
      ctx.fillText("Válido para préstamos y consultas en la biblioteca", finalCanvas.width / 2, 240);

      // Convertir a DataURL
      const finalDataUrl = finalCanvas.toDataURL("image/png");
      onGenerate(finalDataUrl);
      setCredentialGenerated(true);

    } catch (err) {
      console.error("Error generando credencial:", err);
      alert("Hubo un error al generar la credencial.");
    }
  };

  return (
    <div className={`p-4 rounded-xl border mt-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
      <h3 className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
        Paso Opcional: Generar Credencial Digital (Se enviará por correo)
      </h3>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-3 items-center w-full md:w-1/2">
          {!photoCaptured && !cameraActive && (
            <button
              type="button"
              onClick={startCamera}
              className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                isDark ? "border-slate-600 hover:bg-slate-700 text-slate-400" : "border-slate-300 hover:bg-slate-100 text-slate-500"
              }`}
            >
              <Camera size={32} />
              <span>Tomar Foto del Alumno</span>
            </button>
          )}

          {cameraActive && (
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
              <button
                type="button"
                onClick={takePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg"
              >
                Capturar
              </button>
            </div>
          )}

          {photoCaptured && (
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
              <img src={photoCaptured} alt="Foto Alumno" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={startCamera}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors"
                title="Tomar otra foto"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center items-center gap-4">
          <p className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Asegúrate de haber escrito el Nombre y la Matrícula antes de generar la credencial.
          </p>
          
          {credentialGenerated ? (
            <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 size={32} />
              <span className="font-medium text-sm text-center">Credencial Generada Exitosamente</span>
              <span className="text-xs opacity-80 text-center">Se enviará adjunta al correo de bienvenida cuando presiones Guardar.</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={!photoCaptured || !studentData.name || !studentData.studentId}
              onClick={generateCredential}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                !photoCaptured || !studentData.name || !studentData.studentId
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 dark:bg-slate-700 dark:text-slate-500"
                  : "bg-[#1E3A5F] hover:bg-[#2d5a8e] text-white shadow-md dark:bg-blue-600 dark:hover:bg-blue-700"
              }`}
            >
              Generar Credencial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
