'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// BarcodeDetector ainda não tem tipos oficiais na lib DOM do TypeScript.
interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

function subscribeNoop() {
  return () => {};
}
function getBarcodeDetectorSupport() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}
function getServerSupport() {
  return false;
}

// Escaneamento via API nativa do navegador (Chrome/Android) — sem lib externa.
// Em navegadores sem suporte (ex.: Safari/iOS) o botão simplesmente não aparece;
// o código continua podendo ser digitado manualmente a qualquer momento.
export default function QrScanButton({ onScan }: { onScan: (code: string) => void }) {
  // useSyncExternalStore evita o mismatch de hidratação: no servidor sempre
  // retorna false, e só assume o valor real depois de montar no navegador.
  const supported = useSyncExternalStore(subscribeNoop, getBarcodeDetectorSupport, getServerSupport);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!scanning || !window.BarcodeDetector) return;

    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    function stop() {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setScanning(false);
    }

    async function tick() {
      if (cancelled || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          onScanRef.current(results[0].rawValue);
          stop();
          return;
        }
      } catch {
        // erro pontual de detecção de um frame — tenta de novo no próximo
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        console.error('[Sizzle] Erro ao acessar câmera:', err);
        setScanError('Não foi possível acessar a câmera. Verifique a permissão ou digite o código manualmente.');
        setScanning(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scanning]);

  if (!supported) return null;

  return (
    <div style={{ marginBottom: 15 }}>
      {!scanning ? (
        <button
          type="button"
          className="quantity-btn admin-btn"
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
        >
          <i className="fas fa-qrcode" aria-hidden="true" /> Escanear QR code
        </button>
      ) : (
        <div>
          <video ref={videoRef} className="qr-scanner-video" muted playsInline />
          <button
            type="button"
            className="quantity-btn admin-btn"
            style={{ marginTop: 10 }}
            onClick={() => setScanning(false)}
          >
            Cancelar
          </button>
        </div>
      )}
      {scanError && <p className="empty-state">{scanError}</p>}
    </div>
  );
}
