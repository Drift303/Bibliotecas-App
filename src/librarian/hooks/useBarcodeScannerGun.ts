import { useEffect, useRef } from "react";

export function useBarcodeScannerGun(onScan: (code: string) => void) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está pulsando combinaciones de teclas modificadoras (Ctrl+C, etc)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.tagName === "SELECT";
      const isIsbnOrSearch =
        activeEl?.id === "isbn-input" ||
        activeEl?.getAttribute("placeholder")?.toLowerCase().includes("isbn") ||
        activeEl?.getAttribute("placeholder")?.toLowerCase().includes("buscar");

      // Si el usuario está enfocado en una entrada manual de texto (como Título o Autor)
      // y NO es el campo ISBN ni el Buscador, ignorar la captura global de la pistola
      if (isInput && !isIsbnOrSearch) {
        return;
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si pasa demasiado tiempo entre caracteres (> 45ms), limpiar el buffer.
      // Las pistolas lectoras emiten caracteres a velocidades extremadamente altas (< 15ms).
      // El límite de 45ms diferencia la escritura manual humana de una lectura automatizada.
      if (diff > 45 && bufferRef.current.length > 0) {
        bufferRef.current = [];
      }

      // Si se pulsa Enter y el buffer tiene una longitud aceptable para un código, disparamos el scan
      if (e.key === "Enter") {
        if (bufferRef.current.length >= 3) {
          const barcode = bufferRef.current.join("");
          bufferRef.current = [];
          onScan(barcode);
          e.preventDefault();
        }
        return;
      }

      // Capturar caracteres alfanuméricos simples
      if (e.key.length === 1) {
        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScan]);
}
