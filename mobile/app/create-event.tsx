import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { organizerApi } from "@/api/organizerApi";
import { AppText, Button, Chip, Input, Screen, ScreenHeader } from "@/components";
import { space } from "@/theme";
import type { HackathonMode } from "@/types/api";
import { parseLocalDateTime } from "@/utils/format";

const MODES: { key: HackathonMode; label: string }[] = [{ key: "ONLINE", label: "Online" }, { key: "OFFLINE", label: "Offline" }, { key: "HYBRID", label: "Hybrid" }];

export default function CreateEventScreen() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", college: "", location: "", theme: "", tags: "", description: "", problemStatement: "", prize: "", start: "", end: "" });
  const [mode, setMode] = useState<HackathonMode>("ONLINE");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    const start = parseLocalDateTime(f.start);
    const end = f.end.trim() ? parseLocalDateTime(f.end, 18) : null;
    if (f.name.trim().length < 3) return setError("Enter the hackathon name.");
    if (!start) return setError("Start date must look like 2026-11-20 or 2026-11-20 09:30.");
    if (f.end.trim() && !end) return setError("End date must look like 2026-11-21 or 2026-11-21 18:00.");
    if (end && end <= start) return setError("End must be after the start.");
    setSaving(true); setError(null);
    try {
      const h = await organizerApi.create({
        name: f.name.trim(), college: f.college.trim(), location: f.location.trim(), mode, theme: f.theme.trim(),
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), description: f.description, problemStatement: f.problemStatement,
        prize: Number(f.prize.replace(/\D/g, "")) || 0, startDate: start.toISOString(), endDate: end?.toISOString(),
      });
      router.replace(`/event/${h.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create the hackathon."); }
    finally { setSaving(false); }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Launch a Hackathon" back />
      <View style={{ gap: space.lg }}>
        <Input label="Name" value={f.name} onChangeText={set("name")} autoCapitalize="words" />
        <Input label="College or organization" value={f.college} onChangeText={set("college")} autoCapitalize="words" />
        <Input label="Location" value={f.location} onChangeText={set("location")} autoCapitalize="words" />
        <View style={{ gap: 6 }}>
          <AppText variant="caption" color="textSecondary">Mode</AppText>
          <View style={{ flexDirection: "row", gap: space.sm }}>{MODES.map((m) => <Chip key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(m.key)} />)}</View>
        </View>
        <Input label="Start (local time)" value={f.start} onChangeText={set("start")} placeholder="2026-11-20 09:30" keyboardType="numbers-and-punctuation" />
        <Input label="End (optional)" value={f.end} onChangeText={set("end")} placeholder="2026-11-21 18:00" keyboardType="numbers-and-punctuation" />
        <Input label="Prize pool (INR)" value={f.prize} onChangeText={set("prize")} keyboardType="number-pad" />
        <Input label="Theme" value={f.theme} onChangeText={set("theme")} autoCapitalize="sentences" />
        <Input label="Tags" value={f.tags} onChangeText={set("tags")} hint="Comma separated, for example AI, Web3, Health" />
        <Input label="Description" value={f.description} onChangeText={set("description")} multiline autoCapitalize="sentences" />
        <Input label="Problem statement" value={f.problemStatement} onChangeText={set("problemStatement")} multiline autoCapitalize="sentences" />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        <Button label="Launch hackathon" onPress={submit} loading={saving} />
      </View>
    </Screen>
  );
}
