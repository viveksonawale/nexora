import { View } from "react-native";
import { useRouter } from "expo-router";
import { QrCode } from "lucide-react-native";
import { EmptyState, ErrorState, HackathonCard, LoadingState, Screen, ScreenHeader } from "@/components";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { colors, space } from "@/theme";

export default function OrganizerAttendance() {
  const router = useRouter();
  const q = useOrganizerEvents();
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="Attendance" subtitle="Choose an event to start or monitor a session." />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        q.data && q.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>{q.data.items.map((h) => <HackathonCard key={h.id} item={h} onPress={() => router.push(`/attendance-control/${h.id}`)} />)}</View>
        ) : <EmptyState icon={<QrCode size={30} color={colors.textMuted} />} title="No events to track" message="Launch a hackathon first, then run attendance here." />}
    </Screen>
  );
}
