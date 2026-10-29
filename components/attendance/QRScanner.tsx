"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, AlertCircle, ShieldAlert, VideoOff } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isActive: boolean;
}

export function QRScanner({ onScanSuccess, onScanError, isActive }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [errorType, setErrorType] = useState<"PERMISSION" | "NO_CAMERA" | "INSECURE" | "GENERIC" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerInstance = useRef<Html5Qrcode | null>(null);
  const isStarting = useRef(false);

  useEffect(() => {
    if (!isActive || !scannerRef.current) return;

    // 1. Check HTTPS requirement
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setErrorType("INSECURE");
      setErrorMessage("Camera access requires a secure connection (HTTPS). Please access this site over HTTPS.");
      return;
    }

    // 2. Check getUserMedia support
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType("NO_CAMERA");
      setErrorMessage("Camera access is not supported on this browser or device.");
      return;
    }

    const startScanner = async () => {
      if (isStarting.current) return;
      isStarting.current = true;

      try {
        // Enforce camera stream permission check via getUserMedia
        const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Release test stream tracks before handing off to scanner
        testStream.getTracks().forEach((track) => track.stop());

        if (!scannerRef.current) return;

        scannerInstance.current = new Html5Qrcode(scannerRef.current.id);
        await scannerInstance.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (err) => {
            if (onScanError) {
              onScanError(err);
            }
          }
        );

        setErrorType(null);
        setErrorMessage(null);
      } catch (err: any) {
        const name = err?.name || "";
        const msg = err?.message || "";

        if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.toLowerCase().includes("permission")) {
          setErrorType("PERMISSION");
          setErrorMessage(
            "Camera permission was denied. Please allow camera access in your browser settings to scan the attendance QR code."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.toLowerCase().includes("not found")) {
          setErrorType("NO_CAMERA");
          setErrorMessage("No active camera was detected on this device.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setErrorType("GENERIC");
          setErrorMessage("Camera is currently in use by another tab or app. Please close other camera apps and retry.");
        } else {
          setErrorType("GENERIC");
          setErrorMessage(msg || "Failed to initialize camera scanner.");
        }
      } finally {
        isStarting.current = false;
      }
    };

    startScanner();

    return () => {
      if (scannerInstance.current && scannerInstance.current.isScanning) {
        scannerInstance.current
          .stop()
          .then(() => {
            scannerInstance.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, [isActive, onScanSuccess, onScanError]);

  if (errorMessage) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-center space-y-4 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          {errorType === "PERMISSION" ? (
            <ShieldAlert size={28} />
          ) : errorType === "NO_CAMERA" ? (
            <VideoOff size={28} />
          ) : (
            <AlertCircle size={28} />
          )}
        </div>
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm text-white">
            {errorType === "PERMISSION"
              ? "Camera Permission Required"
              : errorType === "NO_CAMERA"
              ? "Camera Not Detected"
              : errorType === "INSECURE"
              ? "HTTPS Required"
              : "Camera Error"}
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{errorMessage}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-xs transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-3xl bg-black border-2 border-zinc-800 shadow-2xl">
      {/* Viewfinder Target Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <div className="w-56 h-56 border-2 border-orange-500/80 rounded-2xl relative animate-pulse">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#F97316] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#F97316] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#F97316] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#F97316] rounded-br-lg" />
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#F97316] to-transparent absolute top-1/2 -translate-y-1/2 animate-[bounce_2s_infinite]" />
        </div>
      </div>

      <div id="qr-reader" ref={scannerRef} className="w-full aspect-square" />
    </div>
  );
}
