import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { AppText, Button, Input, Screen, ScreenHeader } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { space } from "@/theme";
import { isEmail } from "@/utils/validation";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!isEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setLoading(true); setError(null);
    try {
      await login(email, password); // the root Gate moves the user to their home screen
    } catch (e) {
      if (e instanceof ApiError && e.code === "NOT_VERIFIED") router.push({ pathname: "/(auth)/otp", params: { email: email.trim().toLowerCase() } });
      else setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally { setLoading(false); }
  }

  return (
    <Screen>
      <ScreenHeader title="Welcome back" subtitle="Sign in to your Nexora account." back />
      <View style={{ gap: space.lg }}>
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Input label="Password" value={password} onChangeText={setPassword} secure autoComplete="password" textContentType="password" onSubmitEditing={submit} />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        <Pressable onPress={() => router.push("/(auth)/forgot-password")} hitSlop={10}><AppText variant="caption" color="cyan">Forgot password?</AppText></Pressable>
        <Button label="Sign in" onPress={submit} loading={loading} />
        <Button label="Create an account" variant="ghost" onPress={() => router.replace("/(auth)/signup")} />
      </View>
    </Screen>
  );
}
