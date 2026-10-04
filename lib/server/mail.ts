/** Sends a one-time code. Uses Resend if RESEND_API_KEY is set, otherwise logs (dev only). */
export async function sendOtpEmail(to: string, code: string, purpose: "VERIFY" | "RESET") {
  const subject = purpose === "VERIFY" ? "Verify your Nexora account" : "Reset your Nexora password";
  const text = `Your Nexora code is ${code}. It expires in 10 minutes.`;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY missing in production");
    console.log(`[dev mail] to=${to} code=${code}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Nexora <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) throw new Error(`Mail provider error ${res.status}`);
}
