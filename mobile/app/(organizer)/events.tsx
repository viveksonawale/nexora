import { View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarPlus, Plus } from "lucide-react-native";
import { Button, EmptyState, ErrorState, HackathonCard, LoadingState, Screen, ScreenHeader } from "@/components";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { colors, space } from "@/theme";

export default function OrganizerEvents() {
  const router = useRouter();
  const q = useOrganizerEvents();
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="Events" subtitle="Registrations, judges, submissions and results." right={<Button label="New" compact icon={<Plus size={16} color={colors.onAccent} />} onPress={() => router.push("/create-event")} />} />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        q.data && q.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>{q.data.items.map((h) => <HackathonCard key={h.id} item={h} onPress={() => router.push(`/event/${h.id}`)} />)}</View>
        ) : <EmptyState icon={<CalendarPlus size={30} color={colors.textMuted} />} title="No events yet" message="Launch a hackathon to see it here." />}
    </Screen>
  );
}
