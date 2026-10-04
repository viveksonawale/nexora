export function generateDemoQRValue(sessionId: string, rotation: number): string {
  const timestamp = Date.now();
  return `NEXORA_ATTENDANCE:${sessionId}:${rotation}:${timestamp}`;
}
