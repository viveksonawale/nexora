import { View } from "react-native";
import { useRouter } from "expo-router";
import { History } from "lucide-react-native";
import { judgeApi } from "@/api/judgeApi";
import { AppText, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { colors, space } from "@/theme";
import { formatDateTime } from "@/utils/format";

export default function JudgeHistory() {
  const router = useRouter();
  const q = useAsync(() => judgeApi.history(), [], { refetchOnFocus: true });
  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="History" subtitle="Your submitted evaluations." />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        q.data && q.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>
            {q.data.items.map((h) => (
              <Card key={h.submissionId} onPress={() => router.push(`/evaluate/${h.submissionId}`)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="mono" color="cyan">{h.projectCode}</AppText>
                  <AppText variant="mono" color="success">{h.score}/100</AppText>
                </View>
                <AppText variant="bodyStrong">{h.title}</AppText>
                <AppText variant="caption" color="textSecondary">{h.hackathonName} · {formatDateTime(h.createdAt)}</AppText>
                {!!h.comments && <AppText color="textSecondary" numberOfLines={2}>{h.comments}</AppText>}
              </Card>
            ))}
          </View>
        ) : <EmptyState icon={<History size={30} color={colors.textMuted} />} title="No evaluations yet" message="Evaluations you submit will be listed here." />}
    </Screen>
  );
}
