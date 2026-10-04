import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { authApi } from "@/api/authApi";
import { AppText, Button, Input, OTPInput, PasswordStrength, Screen, ScreenHeader } from "@/components";
import { space } from "@/theme";
import { isEmail } from "@/utils/validation";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setLoading(true); setError(null);
    try { await authApi.forgotPassword(email.trim().toLowerCase()); setStep("reset"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send the code."); }
    finally { setLoading(false); }
  }

  async function reset() {
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true); setError(null);
    try {
      await authApi.resetPassword({ email: email.trim().toLowerCase(), code, password });
      Alert.alert("Password updated", "Sign in with your new password.", [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reset the password."); }
    finally { setLoading(false); }
  }

  return (
    <Screen>
      <ScreenHeader title="Reset password" subtitle={step === "email" ? "We will email you a 6-digit code." : `Enter the code sent to ${email} and choose a new password.`} back />
      <View style={{ gap: space.lg }}>
        {step === "email" ? (
          <>
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            {!!error && <AppText variant="caption" color="error">{error}</AppText>}
            <Button label="Send code" onPress={sendCode} loading={loading} />
          </>
        ) : (
          <>
            <OTPInput value={code} onChange={setCode} />
            <Input label="New password" value={password} onChangeText={setPassword} secure autoComplete="new-password" />
            <PasswordStrength password={password} />
            {!!error && <AppText variant="caption" color="error">{error}</AppText>}
            <Button label="Update password" onPress={reset} loading={loading} disabled={code.length !== 6} />
          </>
        )}
      </View>
    </Screen>
  );
}
