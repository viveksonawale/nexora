export function generateDemoQRValue(rotation: number): string {
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEMO_SESSION_04_${rotation}_${timestamp}_${randomValue}`;
}
