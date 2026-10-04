import { View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarX } from "lucide-react-native";
import { hackathonApi } from "@/api/hackathonApi";
import { Button, EmptyState, ErrorState, HackathonCard, LoadingState, Screen, ScreenHeader, SignInPrompt } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { colors, space } from "@/theme";

export default function MyEventsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const q = useAsync(() => hackathonApi.mine(), [user?.id], { enabled: !!user, refetchOnFocus: true });

  return (
    <Screen refreshing={q.refreshing} onRefresh={user ? q.refresh : undefined}>
      <ScreenHeader title="My Events" subtitle="Hackathons you have registered for." />
      {!user ? <SignInPrompt message="Sign in to see the hackathons you registered for." /> :
        q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        q.data && q.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>{q.data.items.map((h) => <HackathonCard key={h.id} item={h} />)}</View>
        ) : (
          <EmptyState icon={<CalendarX size={30} color={colors.textMuted} />} title="No registrations yet" message="Register for a hackathon and it will show up here."
            action={<Button label="Explore hackathons" variant="secondary" compact onPress={() => router.push("/(participant)/hackathons")} />} />
        )}
    </Screen>
  );
}
