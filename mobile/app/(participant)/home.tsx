import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Compass, Info, QrCode, Rocket, ScanEye, Sparkles, Users } from "lucide-react-native";
import { AppText, Button, Card, EmptyState, ErrorState, HackathonCard, LoadingState, Screen, SectionHeader } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useHackathons } from "@/hooks/useHackathons";
import { colors, radius, space } from "@/theme";

const FEATURES = [
  { icon: QrCode, title: "Dynamic attendance", text: "Scan a rotating QR to mark yourself present. One scan per session.", to: "/(participant)/attendance" },
  { icon: ScanEye, title: "Blind judging", text: "Judges see project IDs only. Submitter details stay hidden.", to: null },
  { icon: Users, title: "Hackathon management", text: "Registrations, judges, timeline and results in one place for organizers.", to: null },
  { icon: Sparkles, title: "AI problem statement summary", text: "Paste a problem statement and get a short summary with key points.", to: "/ai-summary" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const live = useHackathons({ filter: "live" });

  function launch() {
    if (!user) return router.push("/(auth)/login");
    Alert.alert("Organizer account needed", "Launching a hackathon requires an organizer account. Sign out and create an account as an Organizer.");
  }

  return (
    <Screen refreshing={live.refreshing} onRefresh={live.refresh}>
      <View style={styles.brandRow}>
        <AppText variant="heading" color="cyan" style={styles.wordmark}>NEXORA</AppText>
        <Pressable onPress={() => router.push("/about")} hitSlop={12} accessibilityLabel="About Nexora"><Info size={20} color={colors.textSecondary} /></Pressable>
      </View>

      <LinearGradient colors={["#0A1E33", colors.surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <AppText variant="display">Run and join hackathons, end to end.</AppText>
        <AppText color="textSecondary">Discover events, register, mark attendance and get judged blind, all from your phone.</AppText>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button label="Explore Hackathons" icon={<Compass size={18} color={colors.onAccent} />} onPress={() => router.push("/(participant)/hackathons")} />
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button label="Launch a Hackathon" variant="secondary" icon={<Rocket size={16} color={colors.text} />} onPress={launch} style={{ flex: 1 }} compact />
            <Button label="Explore Challenges" variant="secondary" onPress={() => router.push({ pathname: "/(participant)/hackathons", params: { filter: "open" } })} style={{ flex: 1 }} compact />
          </View>
        </View>
      </LinearGradient>

      <SectionHeader title="Live hackathons" action="See all" onAction={() => router.push({ pathname: "/(participant)/hackathons", params: { filter: "live" } })} />
      {live.loading ? <LoadingState /> : live.error ? <ErrorState error={live.error} onRetry={live.reload} /> :
        live.data && live.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>{live.data.items.map((h) => <HackathonCard key={h.id} item={h} />)}</View>
        ) : (
          <EmptyState title="No live hackathons right now" message="Browse upcoming and open events to find your next one." action={<Button label="Browse hackathons" variant="secondary" compact onPress={() => router.push("/(participant)/hackathons")} />} />
        )}

      <SectionHeader title="What you can do on Nexora" />
      <View style={{ gap: space.md }}>
        {FEATURES.map(({ icon: Icon, title, text, to }) => (
          <Card key={title} onPress={to ? () => router.push(to) : undefined}>
            <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
              <View style={styles.iconBox}><Icon size={20} color={colors.cyan} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{title}</AppText>
                <AppText variant="caption" color="textSecondary">{text}</AppText>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg },
  wordmark: { letterSpacing: 4 },
  hero: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderActive, padding: space.xl, gap: space.md },
  iconBox: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: "#06222B", borderWidth: 1, borderColor: colors.borderActive, alignItems: "center", justifyContent: "center" },
});
