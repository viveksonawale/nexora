"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
}

export function QRScanner({ onScanSuccess, onScanError, isActive }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const scannerInstance = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isActive || !scannerRef.current) return;

    const startScanner = async () => {
      try {
        scannerInstance.current = new Html5Qrcode(scannerRef.current!.id);
        await scannerInstance.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );
        setPermissionError(null);
      } catch (err: any) {
        setPermissionError(err?.message || "Failed to start camera. Please check permissions.");
      }
    };

    startScanner();

    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current.stop().catch(console.error);
      }
    };
  }, [isActive, onScanSuccess, onScanError]);

  if (permissionError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
        {permissionError}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black/10 border border-[var(--border)]">
      <div id="qr-reader" ref={scannerRef} className="w-full" />
    </div>
  );
}
