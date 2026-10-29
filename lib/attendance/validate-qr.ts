import { getSession } from "./attendance-session";

export interface ValidationResult {
  valid: boolean;
  message: string;
  sessionId?: string;
  hackathonId?: string;
}

export function validateQR(qrValue: string): ValidationResult {
  if (!qrValue || typeof qrValue !== "string") {
    return { valid: false, message: "Invalid QR code format." };
  }

  const parts = qrValue.split(":");
  
  if (parts[0] !== "NEXORA_ATTENDANCE" || (parts.length !== 4 && parts.length !== 5)) {
    return { valid: false, message: "Unrecognized QR code." };
  }

  let hackathonId: string | undefined;
  let sessionId: string;
  let timestampStr: string;

  if (parts.length === 5) {
    [, hackathonId, sessionId, , timestampStr] = parts;
  } else {
    [, sessionId, , timestampStr] = parts;
  }

  const timestamp = parseInt(timestampStr, 10);
  
  if (isNaN(timestamp)) {
    return { valid: false, message: "Invalid QR data." };
  }

  // QR valid window: 120 seconds
  if (Date.now() - timestamp > 120000) {
    return { valid: false, message: "This QR code has expired. Please scan the current code on screen." };
  }

  const currentSession = getSession();
  // If running in same browser environment where session exists, verify state
  if (currentSession) {
    if (currentSession.status !== "ACTIVE") {
      return { valid: false, message: "No active attendance session." };
    }
    if (currentSession.id !== sessionId) {
      return { valid: false, message: "QR code is for a different session." };
    }
  }

  return { valid: true, message: "Valid QR code.", sessionId, hackathonId };
}
