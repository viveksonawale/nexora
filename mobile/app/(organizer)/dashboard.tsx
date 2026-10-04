import { View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { AppText, Button, EmptyState, ErrorState, HackathonCard, LoadingState, Screen, ScreenHeader, SectionHeader, StatCard } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { colors, space } from "@/theme";

export default function OrganizerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const q = useOrganizerEvents();
  const items = q.data?.items ?? [];
  const active = items.filter((h) => h.status === "LIVE" || h.status === "OPEN");

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="Dashboard" subtitle={user ? `Signed in as ${user.name}` : undefined} />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            <StatCard label="Events" value={items.length} />
            <StatCard label="Registrations" value={items.reduce((t, h) => t + h.participantCount, 0)} />
            <StatCard label="Live or open" value={active.length} />
          </View>
          <View style={{ marginTop: space.lg }}><Button label="Launch a Hackathon" icon={<Plus size={18} color={colors.onAccent} />} onPress={() => router.push("/create-event")} /></View>
          <SectionHeader title="Live and open events" />
          {active.length > 0 ? (
            <View style={{ gap: space.md }}>{active.map((h) => <HackathonCard key={h.id} item={h} onPress={() => router.push(`/event/${h.id}`)} />)}</View>
          ) : (
            <EmptyState title="Nothing running right now" message={items.length ? "Your other events are upcoming or ended." : "Launch your first hackathon to start taking registrations."} />
          )}
        </>
      )}
    </Screen>
  );
}
