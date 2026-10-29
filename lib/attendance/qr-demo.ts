export function generateDemoQRValue(sessionId: string, rotation: number, hackathonId?: string): string {
  const timestamp = Date.now();
  if (hackathonId) {
    return `NEXORA_ATTENDANCE:${hackathonId}:${sessionId}:${rotation}:${timestamp}`;
  }
  return `NEXORA_ATTENDANCE:${sessionId}:${rotation}:${timestamp}`;
}
