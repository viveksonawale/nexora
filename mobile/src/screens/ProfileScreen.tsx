import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Info, LogOut } from "lucide-react-native";
import { AppText, Avatar, Button, Card, Input, Screen, ScreenHeader, SignInPrompt } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { colors, space } from "@/theme";

const roleLabel = { PARTICIPANT: "Participant", ORGANIZER: "Organizer", JUDGE: "Judge" } as const;

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [college, setCollege] = useState(user?.college ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Profile" />
        <SignInPrompt message="Sign in to manage your profile, registrations and submissions." />
        <Button label="About Nexora" variant="ghost" icon={<Info size={16} color={colors.text} />} onPress={() => router.push("/about")} />
      </Screen>
    );
  }

  async function save() {
    if (name.trim().length < 2) return setError("Enter your full name.");
    setSaving(true); setError(null);
    try { await updateProfile({ name: name.trim(), college: college.trim() }); setEditing(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save changes."); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <Avatar name={user.name} size={52} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{user.name}</AppText>
            <AppText variant="caption" color="textSecondary">{user.email}</AppText>
            <AppText variant="caption" color="cyan">{roleLabel[user.role]}</AppText>
          </View>
        </View>
        {!editing && !!user.college && <AppText color="textSecondary">{user.college}</AppText>}
      </Card>

      {editing ? (
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="College" value={college} onChangeText={setCollege} autoCapitalize="words" />
          {!!error && <AppText variant="caption" color="error">{error}</AppText>}
          <Button label="Save changes" onPress={save} loading={saving} />
          <Button label="Cancel" variant="ghost" onPress={() => { setEditing(false); setName(user.name); setCollege(user.college); }} />
        </View>
      ) : (
        <View style={{ gap: space.sm, marginTop: space.lg }}>
          <Button label="Edit profile" variant="secondary" onPress={() => setEditing(true)} />
          <Button label="About Nexora" variant="ghost" icon={<Info size={16} color={colors.text} />} onPress={() => router.push("/about")} />
          <Button label="Sign out" variant="danger" icon={<LogOut size={16} color={colors.error} />} onPress={() => Alert.alert("Sign out", "You will need to sign in again.", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => void logout() }])} />
        </View>
      )}
    </Screen>
  );
}
