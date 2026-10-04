import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, MapPin, Share2, Trophy, Users } from "lucide-react-native";
import { hackathonApi } from "@/api/hackathonApi";
import { AiSummaryBox, AppText, AvatarStack, Button, Card, Countdown, ErrorState, LoadingState, Screen, ScreenHeader, StatusBadge } from "@/components";
import { WEB_URL } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { useHackathon } from "@/hooks/useHackathons";
import { colors, space } from "@/theme";
import { formatDate, formatPrize, modeLabel } from "@/utils/format";

export default function HackathonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: h, error, loading, reload } = useHackathon(id);
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function register() {
    if (!user) return router.push("/(auth)/login");
    setBusy(true); setActionError(null);
    try { await hackathonApi.register(id); reload(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Could not register."); }
    finally { setBusy(false); }
  }

  if (loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (error || !h) return <Screen><ScreenHeader title="Hackathon" back /><ErrorState error={error ?? new Error("Not found")} onRetry={reload} /></Screen>;

  const ic = { size: 16, color: colors.textMuted };
  const canSubmit = h.isRegistered && (h.status === "LIVE" || h.status === "OPEN");

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        title={h.name}
        back
        right={<Pressable hitSlop={12} accessibilityLabel="Share" onPress={() => Share.share({ message: `${h.name} on Nexora${WEB_URL ? `\n${WEB_URL}/hackathons` : ""}` })}><Share2 size={20} color={colors.textSecondary} /></Pressable>}
      />
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
          <StatusBadge status={h.status} />
          <AppText variant="caption" color="textMuted">{modeLabel[h.mode]}</AppText>
        </View>
        {!!h.college && <AppText color="textSecondary">{h.college}</AppText>}

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><Calendar {...ic} /><AppText>{formatDate(h.startDate)}{h.endDate ? ` to ${formatDate(h.endDate)}` : ""}</AppText></View>
          {!!h.location && <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><MapPin {...ic} /><AppText>{h.location}</AppText></View>}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><Trophy {...ic} /><AppText variant="mono">{formatPrize(h.prize, h.currency)}</AppText></View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}><Users {...ic} /><AvatarStack names={h.participantPreview} total={h.participantCount} /><AppText variant="caption" color="textSecondary">{h.participantCount} registered</AppText></View>
          {h.status !== "ENDED" && <View style={{ marginTop: space.xs }}><AppText variant="caption" color="textMuted">Starts in</AppText><Countdown to={h.startDate} /></View>}
        </Card>

        {!!h.theme && <View style={{ gap: 4 }}><AppText variant="heading">Theme</AppText><AppText color="textSecondary">{h.theme}</AppText></View>}
        {!!h.description && <View style={{ gap: 4 }}><AppText variant="heading">About</AppText><AppText color="textSecondary">{h.description}</AppText></View>}
        {h.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {h.tags.map((t) => <View key={t} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}><AppText variant="caption" color="textSecondary">{t}</AppText></View>)}
          </View>
        )}
        {!!h.problemStatement && (
          <View style={{ gap: space.md }}>
            <AppText variant="heading">Problem statement</AppText>
            <AppText color="textSecondary">{h.problemStatement}</AppText>
            <AiSummaryBox text={h.problemStatement} />
          </View>
        )}

        {!!actionError && <AppText variant="caption" color="error">{actionError}</AppText>}
        {h.isOwner ? (
          <Button label="Manage event" onPress={() => router.push(`/event/${h.id}`)} />
        ) : user && user.role !== "PARTICIPANT" ? (
          <AppText variant="caption" color="textMuted">Only participant accounts can register for hackathons.</AppText>
        ) : h.isRegistered ? (
          <View style={{ gap: space.sm }}>
            <AppText color="success">You are registered.</AppText>
            {canSubmit && <Button label={h.hasSubmitted ? "Edit submission" : "Submit project"} onPress={() => router.push(`/submit/${h.id}`)} />}
          </View>
        ) : (
          <Button label={h.status === "ENDED" ? "Registration closed" : "Apply now"} onPress={register} loading={busy} disabled={h.status === "ENDED"} />
        )}
      </View>
    </Screen>
  );
}
