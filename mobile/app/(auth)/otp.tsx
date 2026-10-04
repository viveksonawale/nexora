import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { authApi } from "@/api/authApi";
import { AppText, Button, OTPInput, Screen, ScreenHeader } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { space } from "@/theme";

export default function OtpScreen() {
  const { email = "" } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify() {
    setLoading(true); setError(null);
    try { await verifyOtp(email, code); } // success: Gate routes to the role home
    catch (e) { setError(e instanceof Error ? e.message : "Could not verify the code."); setCode(""); }
    finally { setLoading(false); }
  }

  async function resend() {
    setError(null); setInfo(null);
    try { await authApi.resendOtp(email); setCooldown(30); setInfo("A new code is on its way."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not resend the code."); }
  }

  return (
    <Screen>
      <ScreenHeader title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email}.`} back />
      <View style={{ gap: space.xl }}>
        <OTPInput value={code} onChange={setCode} />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        {!!info && <AppText variant="caption" color="success">{info}</AppText>}
        <Button label="Verify" onPress={verify} loading={loading} disabled={code.length !== 6} />
        <Button label={cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"} variant="ghost" onPress={resend} disabled={cooldown > 0} />
      </View>
    </Screen>
  );
}
