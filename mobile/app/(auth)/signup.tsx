import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AppText, Button, Chip, Input, PasswordStrength, Screen, ScreenHeader } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { space } from "@/theme";
import type { Role } from "@/types/api";
import { isEmail } from "@/utils/validation";

const ROLES: { key: Role; label: string }[] = [
  { key: "PARTICIPANT", label: "Participant" }, { key: "ORGANIZER", label: "Organizer" }, { key: "JUDGE", label: "Judge" },
];

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PARTICIPANT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!isEmail(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true); setError(null);
    try {
      const to = await signup({ name, email, password, college, role });
      router.push({ pathname: "/(auth)/otp", params: { email: to } });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create the account."); }
    finally { setLoading(false); }
  }

  return (
    <Screen>
      <ScreenHeader title="Create account" subtitle="Join Nexora to run or take part in hackathons." back />
      <View style={{ gap: space.lg }}>
        <View style={{ gap: 6 }}>
          <AppText variant="caption" color="textSecondary">I am joining as</AppText>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {ROLES.map((r) => <Chip key={r.key} label={r.label} active={role === r.key} onPress={() => setRole(r.key)} />)}
          </View>
        </View>
        <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Input label="College" value={college} onChangeText={setCollege} autoCapitalize="words" />
        <Input label="Password" value={password} onChangeText={setPassword} secure autoComplete="new-password" hint="At least 8 characters." />
        <PasswordStrength password={password} />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        <Button label="Create account" onPress={submit} loading={loading} />
        <Button label="I already have an account" variant="ghost" onPress={() => router.replace("/(auth)/login")} />
      </View>
    </Screen>
  );
}
