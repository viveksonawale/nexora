import { getSession } from "./attendance-session";

export interface ValidationResult {
  valid: boolean;
  message: string;
  sessionId?: string;
}

export function validateQR(qrValue: string): ValidationResult {
  if (!qrValue || typeof qrValue !== "string") {
    return { valid: false, message: "Invalid QR code format." };
  }

  const parts = qrValue.split(":");
  
  if (parts.length !== 4 || parts[0] !== "NEXORA_ATTENDANCE") {
    return { valid: false, message: "Unrecognized QR code." };
  }

  const [, sessionId, rotationStr, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);
  
  if (isNaN(timestamp)) {
    return { valid: false, message: "Invalid QR data." };
  }

  // Optional: check if QR is too old (e.g., > 60 seconds)
  if (Date.now() - timestamp > 60000) {
    return { valid: false, message: "This QR code has expired." };
  }

  const currentSession = getSession();
  
  if (!currentSession || currentSession.status !== "ACTIVE") {
    return { valid: false, message: "No active attendance session." };
  }

  if (currentSession.id !== sessionId) {
    return { valid: false, message: "QR code is for a different session." };
  }

  return { valid: true, message: "Valid QR code.", sessionId };
}
