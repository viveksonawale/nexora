/** The organizer QR encodes `nexora://attendance?t=<signed token>`. Returns the token or null. */
export function parseAttendanceQr(data: string): string | null {
  const m = /^nexora:\/\/attendance\?t=([A-Za-z0-9._-]+)$/.exec(data.trim());
  return m ? m[1] : null;
}
export const buildAttendanceQr = (token: string) => `nexora://attendance?t=${token}`;
